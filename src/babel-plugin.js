// src/babel-plugin.js

const path = require('path');

module.exports = function (babel) {
  const { types: t } = babel;

  return {
    name: "babel-plugin-basis-transform",
    visitor: {
      CallExpression(p, state) {
        if (!p.node.callee.name) return;

        const calleeName = p.node.callee.name;
        const targetFunctions = [
          'useState', 
          'useMemo', 
          'useEffect', 
          'useReducer', 
          'createContext'
        ];

        if (targetFunctions.includes(calleeName)) {
          const filePath = state.file.opts.filename || "UnknownFile";
          const fileName = path.basename(filePath);

          let varName = "anonymous";

          if (t.isVariableDeclarator(p.parent)) {
            const id = p.parent.id;
            
            if (t.isArrayPattern(id)) {
              varName = id.elements[0] && t.isIdentifier(id.elements[0]) 
                ? id.elements[0].name 
                : "state";
            } else if (t.isIdentifier(id)) {
              varName = id.name;
            }
          } else if (calleeName === 'useEffect') {
            varName = `effect_L${p.node.loc?.start.line || 'unknown'}`;
          }
          const uniqueLabel = `${fileName} -> ${varName}`;
          const labelIndexMap = {
            'useState': 1,
            'createContext': 1,
            'useMemo': 2,
            'useEffect': 2,
            'useReducer': 2
          };

          const targetIndex = labelIndexMap[calleeName];
          if (p.node.arguments.length === targetIndex) {
            p.node.arguments.push(t.stringLiteral(uniqueLabel));
          }
        }
      }
    }
  };
};