// swc-plugin/src/lib.rs

use std::collections::{HashMap, HashSet};
use std::path::Path;

use swc_core::{
    common::{comments::Comments, DUMMY_SP, SourceMapper, Spanned},
    ecma::{
        ast::*,
        visit::{visit_mut_pass, VisitMut, VisitMutWith},
    },
    plugin::{
        metadata::TransformPluginMetadataContextKind,
        plugin_transform,
        proxies::{PluginCommentsProxy, PluginSourceMapProxy, TransformPluginProgramMetadata},
    },
};

fn is_audited(name: &str) -> bool {
    matches!(
        name,
        "useState"
            | "useReducer"
            | "useOptimistic"
            | "useActionState"
            | "useTransition"
            | "useMemo"
            | "useCallback"
            | "createContext"
            | "useContext"
            | "useEffect"
            | "useLayoutEffect"
            | "useInsertionEffect"
            | "useRef"
            | "useId"
            | "useImperativeHandle"
            | "useSyncExternalStore"
    )
}

fn label_slot(name: &str) -> Option<usize> {
    match name {
        "useState" | "useRef" | "useId" | "useTransition" | "createContext" => Some(1),
        "useEffect" | "useMemo" | "useLayoutEffect" | "useInsertionEffect"
        | "useCallback" | "useOptimistic" => Some(2),
        "useReducer" | "useActionState" | "useSyncExternalStore" | "useImperativeHandle" => {
            Some(3)
        }
        _ => None,
    }
}

fn is_ignore_file(text: &str) -> bool {
    text.trim() == "@basis-ignore"
}

fn is_ignore_next_line(text: &str) -> bool {
    text.trim() == "@basis-ignore-next-line"
}

fn first_binding(pat: &Pat) -> Option<String> {
    match pat {
        Pat::Ident(b) => Some(b.id.sym.as_str().to_string()),
        Pat::Array(arr) => match arr.elems.first() {
            Some(Some(Pat::Ident(b))) => Some(b.id.sym.as_str().to_string()),
            Some(None) | None => Some("state".into()),
            Some(Some(inner)) => first_binding(inner),
        },
        _ => None,
    }
}

fn exported_name(spec: &ImportNamedSpecifier) -> String {
    match &spec.imported {
        Some(ModuleExportName::Ident(id)) => id.sym.to_string(),
        Some(ModuleExportName::Str(s)) => s.value.as_str().unwrap_or("").to_string(),
        None => spec.local.sym.to_string(),
    }
}

fn unwrap_expr(expr: &Expr) -> &Expr {
    match expr {
        Expr::Paren(p) => unwrap_expr(&p.expr),
        Expr::TsAs(n) => unwrap_expr(&n.expr),
        Expr::TsTypeAssertion(n) => unwrap_expr(&n.expr),
        Expr::TsConstAssertion(n) => unwrap_expr(&n.expr),
        Expr::TsNonNull(n) => unwrap_expr(&n.expr),
        Expr::TsSatisfies(n) => unwrap_expr(&n.expr),
        _ => expr,
    }
}

fn is_direct_call(expr: &Expr) -> bool {
    matches!(unwrap_expr(expr), Expr::Call(_))
}

fn is_directive(item: &ModuleItem) -> bool {
    matches!(
        item,
        ModuleItem::Stmt(Stmt::Expr(ExprStmt { expr, .. }))
            if matches!(&**expr, Expr::Lit(Lit::Str(_)))
    )
}

fn is_use_server_module(module: &Module) -> bool {
    for item in &module.body {
        if !is_directive(item) {
            break;
        }
        if let ModuleItem::Stmt(Stmt::Expr(ExprStmt { expr, .. })) = item {
            if let Expr::Lit(Lit::Str(s)) = &**expr {
                if s.value.as_str() == Some("use server") {
                    return true;
                }
            }
        }
    }
    false
}

fn undefined_arg() -> ExprOrSpread {
    ExprOrSpread {
        spread: None,
        expr: Box::new(Expr::Ident(Ident::new_no_ctxt("undefined".into(), DUMMY_SP))),
    }
}

fn string_arg(value: String) -> ExprOrSpread {
    ExprOrSpread {
        spread: None,
        expr: Box::new(Expr::Lit(Lit::Str(Str {
            span: DUMMY_SP,
            value: value.into(),
            raw: None,
        }))),
    }
}

struct BasisPlugin {
    filename: String,
    source_map: PluginSourceMapProxy,
    comments: PluginCommentsProxy,
    disabled: bool,
    pending_basis: Vec<ImportSpecifier>,
    raw_imports: HashMap<String, Ident>,
    hook_locals: HashMap<String, String>,
    ignore_next_lines: HashSet<usize>,
    current_binding: Option<String>,
    raw_seq: u32,
}

impl BasisPlugin {
    fn basename(&self) -> String {
        Path::new(&self.filename)
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("UnknownFile")
            .to_string()
    }

    fn line_of_pos(&self, pos: swc_core::common::BytePos) -> usize {
        self.source_map.lookup_char_pos(pos).line
    }

    fn collect_ignore_comments(&mut self, lo: swc_core::common::BytePos) {
        if let Some(comments) = self.comments.get_leading(lo) {
            for c in comments {
                if is_ignore_next_line(&c.text) {
                    let end_line = self.line_of_pos(c.span.hi());
                    self.ignore_next_lines.insert(end_line + 1);
                }
            }
        }
    }

    fn file_ignored(&self, module: &Module) -> bool {
        if let Some(comments) = self.comments.get_leading(module.span.lo()) {
            if comments.iter().any(|c| is_ignore_file(&c.text)) {
                return true;
            }
        }

        let first_non_directive = module.body.iter().find(|item| !is_directive(item));

        if let Some(item) = first_non_directive {
            if let Some(comments) = self.comments.get_leading(item.span().lo()) {
                return comments.iter().any(|c| is_ignore_file(&c.text));
            }
        }

        false
    }

    fn call_ignored(&self, call: &CallExpr) -> bool {
        let call_line = self.line_of_pos(call.span().lo());
        if self.ignore_next_lines.contains(&call_line) {
            return true;
        }
        if let Some(comments) = self.comments.get_leading(call.span().lo()) {
            comments.iter().any(|c| {
                is_ignore_next_line(&c.text) && self.line_of_pos(c.span.hi()) + 1 == call_line
            })
        } else {
            false
        }
    }

    fn raw_ident(&mut self, hook: &str) -> Ident {
        if let Some(id) = self.raw_imports.get(hook) {
            return id.clone();
        }
        self.raw_seq += 1;
        let id = Ident::new_no_ctxt(
            format!("_basis_raw_{hook}_{}", self.raw_seq).into(),
            DUMMY_SP,
        );
        self.raw_imports.insert(hook.to_string(), id.clone());
        id
    }

    fn resolve_hook(&self, call: &CallExpr) -> Option<String> {
        match &call.callee {
            Callee::Expr(expr) => match &**expr {
                Expr::Ident(id) => self.hook_locals.get(id.sym.as_str()).cloned(),
                _ => None,
            },
            _ => None,
        }
    }
}

impl VisitMut for BasisPlugin {
    fn visit_mut_module(&mut self, module: &mut Module) {
        if is_use_server_module(module) || self.file_ignored(module) {
            self.disabled = true;
            return;
        }

        self.collect_ignore_comments(module.span.lo());
        module.visit_mut_children_with(self);

        let mut prepend = Vec::new();

        if !self.raw_imports.is_empty() {
            let mut specs: Vec<ImportSpecifier> = self
                .raw_imports
                .iter()
                .map(|(hook, local)| {
                    ImportSpecifier::Named(ImportNamedSpecifier {
                        span: DUMMY_SP,
                        local: local.clone(),
                        imported: Some(ModuleExportName::Ident(Ident::new_no_ctxt(
                            hook.as_str().into(),
                            DUMMY_SP,
                        ))),
                        is_type_only: false,
                    })
                })
                .collect();
            specs.sort_by(|a, b| match (a, b) {
                (ImportSpecifier::Named(a), ImportSpecifier::Named(b)) => {
                    a.local.sym.cmp(&b.local.sym)
                }
                _ => std::cmp::Ordering::Equal,
            });

            prepend.push(ModuleItem::ModuleDecl(ModuleDecl::Import(ImportDecl {
                span: DUMMY_SP,
                specifiers: specs,
                src: Box::new(Str {
                    span: DUMMY_SP,
                    value: "react".into(),
                    raw: None,
                }),
                type_only: false,
                with: None,
                phase: Default::default(),
            })));
        }

        if !self.pending_basis.is_empty() {
            let specs = std::mem::take(&mut self.pending_basis);
            prepend.push(ModuleItem::ModuleDecl(ModuleDecl::Import(ImportDecl {
                span: DUMMY_SP,
                specifiers: specs,
                src: Box::new(Str {
                    span: DUMMY_SP,
                    value: "react-state-basis".into(),
                    raw: None,
                }),
                type_only: false,
                with: None,
                phase: Default::default(),
            })));
        }

        let insert_at = module
            .body
            .iter()
            .take_while(|item| is_directive(item))
            .count();

        for item in prepend.into_iter().rev() {
            module.body.insert(insert_at, item);
        }
    }

    fn visit_mut_module_item(&mut self, item: &mut ModuleItem) {
        self.collect_ignore_comments(item.span().lo());
        item.visit_mut_children_with(self);
    }

    fn visit_mut_stmt(&mut self, stmt: &mut Stmt) {
        self.collect_ignore_comments(stmt.span().lo());
        stmt.visit_mut_children_with(self);
    }

    fn visit_mut_import_decl(&mut self, import: &mut ImportDecl) {
        if self.disabled {
            return;
        }

        import.visit_mut_children_with(self);

        if import.src.value != *"react" && import.src.value != *"react-dom" {
            return;
        }

        let mut basis = Vec::new();
        let mut rest = Vec::new();

        for spec in import.specifiers.drain(..) {
            let hook = match &spec {
                ImportSpecifier::Named(named) => exported_name(named),
                _ => String::new(),
            };

            if is_audited(&hook) {
                if let ImportSpecifier::Named(named) = &spec {
                    self.hook_locals
                        .insert(named.local.sym.as_str().to_string(), hook);
                }
                basis.push(spec);
            } else {
                rest.push(spec);
            }
        }

        if basis.is_empty() {
            import.specifiers = rest;
            return;
        }

        if rest.is_empty() {
            import.specifiers = basis;
            import.src.value = "react-state-basis".into();
            import.src.raw = None;
        } else {
            import.specifiers = rest;
            self.pending_basis.extend(basis);
        }
    }

    fn visit_mut_var_declarator(&mut self, decl: &mut VarDeclarator) {
        self.collect_ignore_comments(decl.span.lo());

        let binding = first_binding(&decl.name);
        let prev = self.current_binding.take();

        if let Some(init) = &mut decl.init {
            if is_direct_call(init) {
                self.current_binding = binding;
            }
            init.visit_mut_with(self);
            self.current_binding = None;
        }

        decl.name.visit_mut_with(self);
        self.current_binding = prev;
    }

    fn visit_mut_call_expr(&mut self, call: &mut CallExpr) {
        self.collect_ignore_comments(call.span().lo());

        if self.disabled {
            call.visit_mut_children_with(self);
            return;
        }

        call.visit_mut_children_with(self);

        let Some(hook) = self.resolve_hook(call) else {
            return;
        };

        if self.call_ignored(call) {
            let raw = self.raw_ident(&hook);
            call.callee = Callee::Expr(Box::new(Expr::Ident(raw)));
            return;
        }

        let Some(slot) = label_slot(&hook) else {
            return;
        };

        let line = self.line_of_pos(call.span().lo());
        let var_name = if let Some(name) = &self.current_binding {
            name.clone()
        } else if matches!(
            hook.as_str(),
            "useEffect" | "useLayoutEffect" | "useInsertionEffect"
        ) {
            format!("effect_L{line}")
        } else {
            "anonymous".into()
        };

        let label = format!("{} -> {}:{line}", self.basename(), var_name);

        while call.args.len() < slot {
            call.args.push(undefined_arg());
        }

        if call.args.len() == slot {
            call.args.push(string_arg(label));
        }
    }
}

#[plugin_transform]
pub fn process_transform(
    mut program: Program,
    data: TransformPluginProgramMetadata,
) -> Program {
    let filename = data
        .get_context(&TransformPluginMetadataContextKind::Filename)
        .unwrap_or_else(|| "UnknownFile".to_string());

    program.mutate(visit_mut_pass(BasisPlugin {
        filename,
        source_map: data.source_map,
        comments: PluginCommentsProxy,
        disabled: false,
        pending_basis: Vec::new(),
        raw_imports: HashMap::new(),
        hook_locals: HashMap::new(),
        ignore_next_lines: HashSet::new(),
        current_binding: None,
        raw_seq: 0,
    }));
    program
}