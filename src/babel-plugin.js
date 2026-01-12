const path = require('path');

module.exports = function (babel) {
  const { types: t } = babel;

  const AUDITED_HOOKS = [
    'useState', 'useReducer', 'useMemo', 'useCallback', 'useEffect',
    'useLayoutEffect', 'useRef', 'useId', 'useDebugValue', 'useImperativeHandle',
    'useInsertionEffect', 'useSyncExternalStore', 'useTransition',
    'useDeferredValue', 'use', 'useOptimistic', 'useActionState'
  ];

  const isIgnoredFile = (comments) =>
    comments && comments.some(c => /@?basis-ignore/.test(c.value));

  return {
    name: "babel-plugin-basis-transform",
    visitor: {
      Program(p, state) {
        if (isIgnoredFile(p.container.comments)) {
          state.basisDisabled = true;
        }
      },

      /**
       * Splits 'react' imports. Standard features (forwardRef, memo) stay in React.
       * Audited hooks are redirected to react-state-basis.
       */
      ImportDeclaration(p, state) {
        if (state.basisDisabled) return;
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

            if (reactSpecifiers.length === 0) {
              p.remove();
            } else {
              p.node.specifiers = reactSpecifiers;
            }
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

        const filePath = state.file.opts.filename || "UnknownFile";
        const fileName = path.basename(filePath);
        let varName = "anonymous";

        if (t.isVariableDeclarator(p.parent)) {
          const id = p.parent.id;
          if (t.isArrayPattern(id)) {
            varName = id.elements[0] && t.isIdentifier(id.elements[0]) ? id.elements[0].name : "state";
          } else if (t.isIdentifier(id)) {
            varName = id.name;
          }
        } else if (['useEffect', 'useLayoutEffect', 'useInsertionEffect'].includes(calleeName)) {
          varName = `effect_L${p.node.loc?.start.line || 'unknown'}`;
        }

        const uniqueLabel = `${fileName} -> ${varName}`;
        const args = p.node.arguments;

        if (['useState', 'useRef', 'useId', 'useDebugValue', 'useDeferredValue', 'useTransition', 'useOptimistic'].includes(calleeName)) {
          if (args.length === 0) args.push(t.identifier('undefined'));
          if (args.length === 1) args.push(t.stringLiteral(uniqueLabel));
        }

        else if (['useEffect', 'useMemo', 'useLayoutEffect', 'useInsertionEffect', 'useCallback'].includes(calleeName)) {
          if (args.length === 1) args.push(t.identifier('undefined'));
          if (args.length === 2) args.push(t.stringLiteral(uniqueLabel));
        }

        else if (['useReducer', 'useActionState', 'useSyncExternalStore', 'useImperativeHandle'].includes(calleeName)) {
          if (args.length === 2) args.push(t.identifier('undefined'));
          if (args.length === 3) args.push(t.stringLiteral(uniqueLabel));
        }
      }
    }
  };
};