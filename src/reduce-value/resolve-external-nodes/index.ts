import path from 'path';
import { ScriptElementKind } from 'typescript';
import { DefinitionInfo, Identifier, Node, Project, SyntaxKind } from 'ts-morph';
import { ExternalDefinition, ImportStatement, ReferenceContext } from 'types';

/**
 * Resolves all external definitions in a given node. These can be either imports or variable declarations.
 * Returns a list of all external definitions that can be written directly to file.
 * @param node Node
 * @param project Project
 * @param context ReferenceContext
 * @param useContext boolean
 */
export function resolveExternalNodes(
  node: Node,
  project: Project,
  context: ReferenceContext,
  useContext = true
): [string, ExternalDefinition] {
  let externalDefinitions: ExternalDefinition = new Set([]);

  recurseNodeBody(node);

  let nodeBody = node.getFullText();

  externalDefinitions.forEach((external) => {
    if ('originalIdentifier' in external && nodeBody.includes(external.originalIdentifier)) {
      nodeBody = nodeBody.replace(external.originalIdentifier, external.identifierName);
    }
  });

  return [nodeBody, externalDefinitions];

  function recurseNodeBody(subNode: Node) {
    subNode.forEachChild((child) => {
      let rootObject: Identifier | undefined;

      if (child.getKind() === SyntaxKind.PropertyAccessExpression) {
        rootObject = getRootOfPropertyAccessExpression(child);
      } else if (child.getChildCount() > 0) {
        recurseNodeBody(child);
      }

      if (child.getKind() === SyntaxKind.Identifier) {
        rootObject = child as Identifier;
      }

      if (rootObject) {
        // if it doesn't have a symbol, it isn't a reference to anything
        const nodeSymbol = rootObject.getSymbol();

        const declarationNodes = nodeSymbol?.getDeclarations();

        if (declarationNodes?.length) {
          let isInternal = false;
          let isNative = false;

          for (const declarationNode of declarationNodes) {
            if (isNativeDefinition(declarationNode)) {
              isNative = true;
              break;
            } else if (node.containsRange(declarationNode.getPos(), declarationNode.getEnd())) {
              isInternal = true;
              break;
            }
          }

          if (!isInternal && !isNative) {
            const definitions = rootObject.getDefinitions();

            for (const definition of definitions) {
              if (isExternalDefinition(definition)) {
                externalDefinitions.add(resolveExternalImport(rootObject, context, useContext));
              } else {
                const extraExternal = resolveIdentifierValue(rootObject, definition, project, context, useContext);
                externalDefinitions = new Set([...externalDefinitions, ...extraExternal]);
              }
            }
          }
        }
      }
    });
  }
}

export function resolveIdentifierValue(
  identifier: Identifier,
  definition: DefinitionInfo,
  project: Project,
  context: ReferenceContext,
  useContext = true
): ExternalDefinition {
  const sourceFile = project.getSourceFileOrThrow(definition.getSourceFile().getFilePath());
  const externalDefinitions: any[] = [];

  let variableDeclaration;

  switch (definition.getKind()) {
    case ScriptElementKind.constElement:
    case ScriptElementKind.letElement:
    case ScriptElementKind.variableElement:
    case ScriptElementKind.localVariableElement:
      variableDeclaration = sourceFile.getVariableDeclarationOrThrow(identifier.getText());
      break;
    case ScriptElementKind.enumElement:
      variableDeclaration = sourceFile.getEnumOrThrow(identifier.getText());
      break;
    case ScriptElementKind.functionElement:
    case ScriptElementKind.localFunctionElement:
      variableDeclaration = sourceFile.getFunctionOrThrow(identifier.getText());
      break;
    case ScriptElementKind.classElement:
    case ScriptElementKind.localClassElement:
      variableDeclaration = sourceFile.getClassOrThrow(identifier.getText());
      break;
    case ScriptElementKind.typeElement:
      variableDeclaration = sourceFile.getTypeAliasOrThrow(identifier.getText());
      break;
    case ScriptElementKind.interfaceElement:
      variableDeclaration = sourceFile.getInterfaceOrThrow(identifier.getText());
      break;
    default:
      throw new Error(`Unsupported identifier kind: ${definition.getKind()}. For ${identifier.getText()}`);
  }

  const [body, externals] = resolveExternalNodes(variableDeclaration!, project, context, useContext);

  externalDefinitions.push(...externals);

  const identifierName = identifier.getText();

  let identifierNameRenamed = identifierName;
  let text = body;

  if (useContext) {
    // get a numeric value for the module from the global module context and replace the identifier suffixed with the module index to ensure uniqueness
    const moduleNamespace = getModuleSpecifier(definition);
    let moduleIndex = context.indexOf(moduleNamespace);
    if (moduleIndex < 0) {
      context.push(moduleNamespace);
      moduleIndex = context.indexOf(moduleNamespace);
    }

    identifierNameRenamed = `${identifierName}$${moduleIndex}`;
    text = body.replace(identifierName, identifierNameRenamed);
  }

  return new Set([
    ...externalDefinitions,
    {
      type: definition.getKind(),
      originalIdentifier: identifierName,
      identifierName: identifierNameRenamed,
      value: text,
      module: getModuleSpecifier(definition)
    }
  ]);
}

// todo: may break for re-exported external imports, ex. export { Foo } from 'node-library';
export function resolveExternalImport(
  rootObject: Identifier,
  context: ReferenceContext,
  useContext = true
): ImportStatement {
  const symbol = rootObject.getSymbol();
  const importStatement = symbol?.getDeclarations()[0];
  const importDeclaration = importStatement?.getFirstAncestorByKind(SyntaxKind.ImportDeclaration);

  if (!importDeclaration || !importStatement) {
    throw new Error(
      `Expected to find import statement for ${rootObject.getText()}, but got none. Identifiers with no initializers should always be external imports, but something went wrong.`
    );
  }

  const typeOnly = importDeclaration.isTypeOnly();

  const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

  let moduleIndex = context.indexOf(moduleSpecifier);
  if (moduleIndex < 0) {
    context.push(moduleSpecifier);
    moduleIndex = context.indexOf(moduleSpecifier);
  }

  const originalIdentifier = rootObject.getText();

  // named import
  if (importStatement.getKind() === SyntaxKind.ImportSpecifier) {
    return {
      type: 'importStatement',
      originalIdentifier,
      identifierName: useContext ? `${originalIdentifier}$${moduleIndex}` : originalIdentifier,
      moduleSpecifier,
      namedImports: [useContext ? `${originalIdentifier} as ${originalIdentifier}$${moduleIndex}` : originalIdentifier],
      isTypeOnly: typeOnly
    };
  }
  // namespace import
  if (importStatement.getKind() === SyntaxKind.NamespaceImport) {
    const splitModuleSpecifier = rootObject.getText().split('/');
    const namespaceName = useContext
      ? `${splitModuleSpecifier[splitModuleSpecifier.length - 1]}$${moduleIndex}`
      : splitModuleSpecifier[splitModuleSpecifier.length - 1];

    return {
      type: 'importStatement',
      originalIdentifier,
      identifierName: namespaceName,
      moduleSpecifier,
      namespaceImport: namespaceName,
      isTypeOnly: typeOnly
    };
  }
  // default import
  if (importStatement.getKind() === SyntaxKind.ImportClause) {
    const splitModuleSpecifier = rootObject.getText().split('/');
    const defaultImportName = useContext
      ? `${splitModuleSpecifier[splitModuleSpecifier.length - 1]}$$${moduleIndex}`
      : splitModuleSpecifier[splitModuleSpecifier.length - 1];

    return {
      type: 'importStatement',
      originalIdentifier,
      identifierName: defaultImportName,
      moduleSpecifier,
      defaultImport: defaultImportName,
      isTypeOnly: typeOnly
    };
  }
  throw new Error(`Unsupported import statement kind: ${importStatement.getKind()}`);
}

function getRootOfPropertyAccessExpression(expression: any): Identifier {
  if (expression.getKind() === SyntaxKind.Identifier) {
    return expression as Identifier;
  }

  if (expression.getKind() === SyntaxKind.ParenthesizedExpression) {
    return getRootOfPropertyAccessExpression(expression.getExpression());
  }

  const firstChild = expression.getFirstChild();
  if (firstChild) {
    return getRootOfPropertyAccessExpression(firstChild);
  }

  throw new Error(`Could find the root of a PropertyAccessExpression: ${expression.getText()}`);
}

function getModuleSpecifier(definition: DefinitionInfo) {
  const workingDirectory = process.cwd();
  const modulePath = definition.getSourceFile().getFilePath();
  const extension = path.extname(definition.getSourceFile().getFilePath());

  return modulePath.replace(workingDirectory, '').replace(extension, '');
}

function isExternalDefinition(definition: Node | DefinitionInfo) {
  const workingDirectory = process.cwd();
  const modulePath = definition.getSourceFile().getFilePath();

  return !modulePath.includes(workingDirectory);
}

function isNativeDefinition(definition: Node | DefinitionInfo) {
  const modulePath = definition.getSourceFile().getFilePath();

  return !!modulePath.match(/typescript\/lib/);
}
