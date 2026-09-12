// src/babel-plugin.js

const path = require('path');

module.exports = function (babel) {
  const { types: t } = babel;

  const LOCAL_HOOKS = [
    'useState', 'useReducer', 'useOptimistic', 'useActionState',
    'useTransition'
  ];

  const PROJECTION_HOOKS = [
    'useMemo', 'useCallback'
  ];

  const CONTEXT_HOOKS = [
    'createContext', 'useContext'
  ];

  const SYSTEM_HOOKS = [
    'useEffect', 'useLayoutEffect', 'useInsertionEffect',
    'useRef', 'useId', 'useImperativeHandle', 'useSyncExternalStore'
  ];

  const AUDITED_HOOKS = [
    ...LOCAL_HOOKS,
    ...PROJECTION_HOOKS,
    ...CONTEXT_HOOKS,
    ...SYSTEM_HOOKS
  ];

  const BASIS_IGNORE_DIRECTIVE = /^\s*@basis-ignore\s*$/;
  const BASIS_IGNORE_NEXT_LINE_DIRECTIVE = /^\s*@basis-ignore-next-line\s*$/;

  const isIgnoredFile = (comments, firstNodeStart) =>
    comments && comments.some(
      c => c.end <= firstNodeStart && BASIS_IGNORE_DIRECTIVE.test(c.value)
    );

  const isIgnoredCallSite = (callPath, state) => {
    const callLine = callPath.node.loc && callPath.node.loc.start.line;
    if (!callLine) return false;
    const comments = (state.file.ast && state.file.ast.comments) || [];
    return comments.some(
      c =>
        BASIS_IGNORE_NEXT_LINE_DIRECTIVE.test(c.value) &&
        c.loc &&
        c.loc.end.line === callLine - 1
    );
  };

  const getRawImportLocal = (programPath, state, hookName) => {
    state.__basisRawImports = state.__basisRawImports || {};
    if (state.__basisRawImports[hookName]) {
      return state.__basisRawImports[hookName];
    }
    const localId = programPath.scope.generateUidIdentifier(`basis_raw_${hookName}`);
    const rawImport = t.importDeclaration(
      [t.importSpecifier(t.cloneNode(localId), t.identifier(hookName))],
      t.stringLiteral('react')
    );

    rawImport._basisRawImport = true;
    programPath.unshiftContainer('body', rawImport);
    state.__basisRawImports[hookName] = localId;
    return localId;
  };

  return {
    name: "babel-plugin-basis-transform",
    visitor: {
      Program(p, state) {
        const firstNode = p.node.body[0];
        const firstNodeStart = firstNode ? firstNode.start : Infinity;
        if (isIgnoredFile(p.container.comments, firstNodeStart)) {
          state.basisDisabled = true;
        }
      },

      ImportDeclaration(p, state) {
        if (state.basisDisabled) return;
        if (p.node._basisRawImport) return;
        const source = p.node.source.value;

        if (source === 'react' || source === 'react-dom') {
          const basisSpecifiers = [];
          const reactSpecifiers = [];

          p.node.specifiers.forEach(spec => {
            if (t.isImportSpecifier(spec) && AUDITED_HOOKS.includes(spec.imported.name)) {
              basisSpecifiers.push(spec);
            } else {
              reactSpecifiers.push(spec);
            }
          });

          if (basisSpecifiers.length > 0) {
            p.insertBefore(t.importDeclaration(basisSpecifiers, t.stringLiteral('react-state-basis')));
            if (reactSpecifiers.length === 0) p.remove();
            else p.node.specifiers = reactSpecifiers;
          }
        }
      },

      CallExpression(p, state) {
        if (state.basisDisabled) return;

        let calleeName = "";
        if (t.isIdentifier(p.node.callee)) {
          calleeName = p.node.callee.name;
        } else if (t.isMemberExpression(p.node.callee) && t.isIdentifier(p.node.callee.property)) {
          calleeName = p.node.callee.property.name;
        }

        if (!calleeName || !AUDITED_HOOKS.includes(calleeName)) return;

        if (isIgnoredCallSite(p, state)) {
          const programPath = p.findParent(pp => pp.isProgram());
          const rawLocal = getRawImportLocal(programPath, state, calleeName);
          p.node.callee = t.cloneNode(rawLocal);
          return;
        }

        const filePath = state.file.opts.filename || "UnknownFile";
        const fileName = path.basename(filePath);
        let varName = "anonymous";

        // Extracting Variable Names for the Basis Labels
        if (t.isVariableDeclarator(p.parent)) {
          const id = p.parent.id;
          if (t.isArrayPattern(id)) {
            varName = id.elements[0] && t.isIdentifier(id.elements[0]) ? id.elements[0].name : "state";
          } else if (t.isIdentifier(id)) {
            varName = id.name;
          }
        }
        else if (['useEffect', 'useLayoutEffect', 'useInsertionEffect'].includes(calleeName)) {
          varName = `effect_L${p.node.loc?.start.line || 'unknown'}`;
        }

        const line = p.node.loc?.start.line ?? 'unknown';
        const uniqueLabel = `${fileName} -> ${varName}:${line}`;
        const args = p.node.arguments;

        // Group 1: Label at index 1 (Standard 1-arg hooks + createContext)
        if ([
          'useState', 'useRef', 'useId',
          'useTransition', 'createContext'
        ].includes(calleeName)) {
          if (args.length === 0) args.push(t.identifier('undefined'));
          if (args.length === 1) args.push(t.stringLiteral(uniqueLabel));
        }

        // Group 2: Label at index 2 (Dependencies hooks + useOptimistic)
        else if ([
          'useEffect', 'useMemo', 'useLayoutEffect', 'useInsertionEffect', 'useCallback',
          'useOptimistic'
        ].includes(calleeName)) {
          if (args.length === 1) args.push(t.identifier('undefined'));
          if (args.length === 2) args.push(t.stringLiteral(uniqueLabel));
        }

        // Group 3: Label at index 3 (Complex initialization hooks)
        else if ([
          'useReducer', 'useActionState', 'useSyncExternalStore', 'useImperativeHandle'
        ].includes(calleeName)) {
          while (args.length < 3) args.push(t.identifier('undefined'));
          if (args.length === 3) args.push(t.stringLiteral(uniqueLabel));
        }
      }
    }
  };
};