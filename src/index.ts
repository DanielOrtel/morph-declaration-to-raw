import {
  Project,
  SyntaxKind,
  ObjectLiteralExpression,
  Identifier,
  ArrayLiteralExpression,
  CallExpression,
  AsExpression,
  SpreadAssignment,
  ParenthesizedExpression,
  PropertyAccessExpression,
  ClassDeclaration,
  ThisExpression,
  PropertyAssignment,
  FunctionExpression,
  EnumDeclaration
} from 'ts-morph';
import { ScriptElementKind } from 'typescript';
import { getMethodInInheritance, getPropertyInInheritance } from 'properties';
import { resolveExternalImport, resolveExternalNodes } from 'resolve-external-nodes';
import { ExternalDefinition, ReferenceContext } from 'types';

export type ReducePropertyToPrimitiveOptions = {
  omit?: string[];
  resolveImports?: boolean;
  reduceEnums?: boolean;
};

export function reducePropertyToPrimitive<T extends any = any>(
  initialInput: any,
  project: Project,
  context: ReferenceContext,
  { omit, resolveImports, reduceEnums }: ReducePropertyToPrimitiveOptions
): [T, ExternalDefinition] {
  let externalDefinitions: ExternalDefinition = new Set([]);
  return [doReduce(initialInput), externalDefinitions];

  // todo: more robust types
  function doReduce(input: any): any {
    switch (input.getKind()) {
      case SyntaxKind.Identifier:
        return resolveIdentifierValue(input);
      case SyntaxKind.StringLiteral:
        return input.getText().slice(1, -1); // Remove quotes
      case SyntaxKind.NumericLiteral:
        return parseFloat(input.getText());
      case SyntaxKind.TrueKeyword:
        return true;
      case SyntaxKind.FalseKeyword:
        return false;
      case SyntaxKind.NullKeyword:
        return null;
      case SyntaxKind.UndefinedKeyword:
        return undefined;
      case SyntaxKind.AsExpression:
        return reduceAsExpression(input);
      case SyntaxKind.ParenthesizedExpression:
        return reduceParenthesizedExpression(input);
      case SyntaxKind.ObjectLiteralExpression:
        return reduceObjectLiteralToPrimitive(input);
      case SyntaxKind.ArrayLiteralExpression:
        return reduceArrayLiteralToPrimitive(input);
      case SyntaxKind.CallExpression:
        return resolveCallExpressionValue(input);
      case SyntaxKind.FunctionExpression:
      case SyntaxKind.ArrowFunction:
        return resolveFunctionExpressionValue(input);
      case SyntaxKind.ThisKeyword:
        return resolveThisKeyword(input);
      case SyntaxKind.EnumDeclaration:
        return reduceEnumDeclaration(input);
      case SyntaxKind.PropertyAccessExpression:
        return resolvePropertyAccessExpression(input);
      case SyntaxKind.PropertyDeclaration:
      case SyntaxKind.VariableDeclaration:
      case SyntaxKind.PropertyAssignment: {
        const initializer = input.getInitializer();
        if (!initializer) {
          return null;
        }
        return doReduce(initializer);
      }
      default:
        throw new Error(`Unsupported initializer kind: ${input.getKindName()}. For ${input.getText()}`);
    }
  }

  function reduceKeyToPrimitive(key: any) {
    switch (key.getKind()) {
      case SyntaxKind.Identifier:
        return key.getText();
      case SyntaxKind.ComputedPropertyName: {
        const expression = key.getExpression();
        return doReduce(expression);
      }
      default:
        throw new Error(`Unsupported ObjectLiteral key: ${key.getKindName()}. For ${key.getText()}`);
    }
  }

  function reduceObjectLiteralToPrimitive(objectLiteral: ObjectLiteralExpression): any {
    let result: any = {};
    objectLiteral.getProperties().forEach((prop) => {
      if (prop.getKind() === SyntaxKind.PropertyAssignment) {
        const name = reduceKeyToPrimitive((prop as PropertyAssignment).getNameNode());
        const value = (prop as any).getInitializer();
        // do not include omitted keys
        if (omit?.includes(name)) return;
        result[name] = doReduce(value);
      }
      if (prop.getKind() === SyntaxKind.SpreadAssignment) {
        const spreadAssignment = prop as SpreadAssignment;
        const expression = spreadAssignment.getExpression();
        const spreadObject = doReduce(expression);
        // omit keys omitted from spread object
        result = { ...result };
        Object.entries(spreadObject).forEach(([key, value]) => {
          if (omit?.includes(key)) return;
          result[key] = value;
        });
      }
    });
    return result;
  }

  function reduceAsExpression(asExpression: AsExpression): any {
    const expression = asExpression.getExpression();
    return doReduce(expression);
  }

  function reduceParenthesizedExpression(parenthesizedExpression: ParenthesizedExpression): any {
    const expression = parenthesizedExpression.getExpression();
    return doReduce(expression);
  }

  function reduceArrayLiteralToPrimitive(arrayLiteral: ArrayLiteralExpression): any[] {
    return arrayLiteral.getElements().map((element) => doReduce(element));
  }

  function resolveIdentifierValue(identifier: Identifier): any {
    const definition = identifier.getDefinitions()[0];

    const sourceFile = project.getSourceFileOrThrow(definition.getSourceFile().getFilePath());

    let variableDeclaration;

    switch (definition.getKind()) {
      case ScriptElementKind.constElement:
      case ScriptElementKind.letElement:
      case ScriptElementKind.variableElement: {
        variableDeclaration = sourceFile.getVariableDeclarationOrThrow(identifier.getText());
        const initializer = variableDeclaration.getInitializer();
        // external import probably, can't deal with it
        if (!initializer) {
          if (resolveImports) {
            const external = resolveExternalImport(identifier, context);
            externalDefinitions.add(external);

            return `Ident[${external.identifierName}]Ident`;
          }
          return null;
        }

        return doReduce(initializer);
      }
      case ScriptElementKind.enumElement: {
        variableDeclaration = sourceFile.getEnumOrThrow(identifier.getText());
        // external import probably, can't deal with it
        if (!variableDeclaration) {
          if (resolveImports) {
            const external = resolveExternalImport(identifier, context);
            externalDefinitions.add(external);

            return `Ident[${external.identifierName}]Ident`;
          }
          return null;
        }

        return doReduce(variableDeclaration);
      }
      case ScriptElementKind.classElement:
      case ScriptElementKind.localClassElement:
        variableDeclaration = sourceFile.getClassOrThrow(identifier.getText());
        return identifier.getText();
      case ScriptElementKind.typeElement:
        return null;
      default:
        throw new Error(`Unsupported identifier kind: ${definition.getKind()}. For ${identifier.getText()}`);
    }
  }

  function reduceEnumDeclaration(expression: EnumDeclaration) {
    if (reduceEnums) {
      const value: { [key: string]: any } = {};

      const enumMembers = expression.getMembers();

      enumMembers.forEach((member) => {
        value[member.getName()] = member.getValue();
      });

      return value;
    }

    const enumMembers = expression.getMembers();
    let value = '{\n';

    enumMembers.forEach((member) => {
      value = value + member.getText() + '\n';
    });

    value = value + '};\n';

    externalDefinitions.add({
      type: 'enum',
      originalIdentifier: expression.getName(),
      identifierName: expression.getName(),
      value: expression.getText(),
      module: expression.getSourceFile().getFilePath()
    });

    return `Ident[${expression.getName()}]Ident`;
  }

  function resolvePropertyAccessExpression(expression: PropertyAccessExpression) {
    const resolvedObject = doReduce(expression.getExpression());
    const propertyName = expression.getName();

    if (resolvedObject === null) {
      return null;
    }

    if (typeof resolvedObject === 'string') {
      return resolvedObject;
    }

    if (resolvedObject && typeof resolvedObject === 'object' && propertyName in resolvedObject) {
      return resolvedObject[propertyName];
    }

    throw new Error(`Property ${propertyName} not found on resolved object.`);
  }

  function resolveThisKeyword(thisExpression: ThisExpression): any {
    const classDeclaration = thisExpression.getFirstAncestorByKind(SyntaxKind.ClassDeclaration) as ClassDeclaration;
    if (!classDeclaration) {
      throw new Error('ThisKeyword used outside of a class.');
    }
    const propertyAccessExpression = thisExpression.getParentIfKind(
      SyntaxKind.PropertyAccessExpression
    ) as PropertyAccessExpression;
    if (!propertyAccessExpression) {
      throw new Error('Unable to resolve property or method name from ThisKeyword.');
    }

    const propertyName = propertyAccessExpression.getName();
    if (!propertyName) {
      throw new Error('Unable to resolve property or method name from ThisKeyword.');
    }
    const property = getPropertyInInheritance(classDeclaration, propertyName, false, false);
    if (property) {
      const initializer = property.getInitializer();
      if (!initializer) {
        return null;
      }
      return doReduce(initializer);
    }

    const method = getMethodInInheritance(classDeclaration, propertyName, false, false);
    if (method) {
      const body = method.getBody();
      if (!body) {
        return null;
      }
      const returnStatement = body.getFirstDescendantByKind(SyntaxKind.ReturnStatement);
      if (!returnStatement) {
        return null;
      }
      const expression = returnStatement.getExpression();
      if (!expression) {
        return null;
      }

      return doReduce(expression);
    }
  }

  // don't resolve this, there can be too many complexities here, and we don't need it
  function resolveCallExpressionValue(callExpression: CallExpression): any {
    if (resolveImports) {
      const [body, externals] = resolveExternalNodes(callExpression, project, context);

      externalDefinitions = new Set([...externalDefinitions, ...externals]);

      return `Function[${body}]Function`;
    }

    return `Function[${callExpression.getText()}]Function`;
  }

  function resolveFunctionExpressionValue(functionExpression: FunctionExpression): any {
    if (resolveImports) {
      const [body, externals] = resolveExternalNodes(functionExpression, project, context);

      externalDefinitions = new Set([...externalDefinitions, ...externals]);

      return `Function[${body}]Function`;
    }

    return `Function[${functionExpression.getText()}]Function`;
  }
}
