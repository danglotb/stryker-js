import { NodeMutator } from './node-mutator.js';
import { types, type NodePath } from '@babel/core';
import { deepCloneNode } from '../util/index.js';

export const descartesMutator: NodeMutator = {
  name: 'Descartes',

  *mutate(path) {
    if (path.isBlockStatement() && isBodyOfExportedFunctionDeclaration(path)) {
      const returnStatements = collectReturnStatements(path);
      if (returnStatements.length === 0) {
        yield types.blockStatement([]);
        return;
      }

      const returnValue = replacementValue(getMostGenericReturnType(returnStatements));
      yield types.blockStatement([types.returnStatement(returnValue)]);
      return;
    }

    if (path.isFunction()) {
      if (isExportedFunctionDeclaration(path)) {
        return;
      }

      const returnStatements = collectReturnStatements(path);
      if (returnStatements.length === 0) {
        const clone = deepCloneNode(path.node);
        clone.body = types.blockStatement([]);
        yield clone;
        return;
      }

      const clone = deepCloneNode(path.node);
      const returnValue = replacementValue(getMostGenericReturnType(returnStatements));
      clone.body = types.blockStatement([types.returnStatement(returnValue)]);
      yield clone;
    }
  },
};

function isBodyOfExportedFunctionDeclaration(path: NodePath<types.BlockStatement>) {
  return (
    path.parentPath?.isFunctionDeclaration() &&
    isFunctionDeclarationExport(path.parentPath.parentPath)
  );
}

function isExportedFunctionDeclaration(path: NodePath<types.Function>) {
  return (
    path.isFunctionDeclaration() &&
    isFunctionDeclarationExport(path.parentPath)
  );
}

function isFunctionDeclarationExport(path: NodePath | null | undefined) {
  return (
    path?.isExportDefaultDeclaration() || path?.isExportNamedDeclaration()
  );
}

function collectReturnStatements(path: NodePath): types.ReturnStatement[] {
  const returnStatements: types.ReturnStatement[] = [];
  path.traverse({
    ReturnStatement(returnPath) {
      returnStatements.push(returnPath.node);
    },
  });
  return returnStatements;
}

function replacementValue(mostGeneric: string): types.Expression {
  switch (mostGeneric) {
    case 'JSXElement':
      return types.nullLiteral();
    case 'StringLiteral':
      return types.stringLiteral('');
    case 'NumericLiteral':
      return types.numericLiteral(0);
    case 'BooleanLiteral':
      return types.booleanLiteral(false);
    case 'ArrayExpression':
      return types.arrayExpression([]);
    default:
      return types.identifier('undefined');
  }
}

const RETURN_TYPE_PRIORITY = [
  'NullLiteral',
  'NumericLiteral',
  'BooleanLiteral',
  'StringLiteral',
  'ArrayExpression',
  'ObjectExpression',
  'JSXElement',
];

function getMostGenericReturnType(
  returnStatements: types.ReturnStatement[],
): string {
  let maxPriority = -1;
  let mostGeneric = 'undefined';

  for (const stmt of returnStatements) {
    if (stmt.argument === null || stmt.argument === undefined) continue;

    const typeName = stmt.argument.type;
    const priority = RETURN_TYPE_PRIORITY.indexOf(typeName);

    if (priority > maxPriority) {
      maxPriority = priority;
      mostGeneric = typeName;
    }
  }

  return mostGeneric;
}
