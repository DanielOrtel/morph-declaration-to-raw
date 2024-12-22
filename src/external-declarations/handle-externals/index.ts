import { find, flatMap, groupBy, map, uniq } from 'lodash';
import { OptionalKind, ImportDeclarationStructure } from 'ts-morph';
import { ExternalDefinition, ImportStatement, LocalStatement } from 'types';

/**
 * Converts external definitions to a format that can be written to a file with sourceFile.addImportDeclarations
 * @param externals ExternalDefinition
 */
export function externalsToWritableDeclarations(
  externals: ExternalDefinition
): [OptionalKind<ImportDeclarationStructure>[], LocalStatement[]] {
  const allImports = Array.from(externals).filter((external) => external.type === 'importStatement');
  const allDefinitions = Array.from(externals).filter((external) => external.type !== 'importStatement');

  const uniqueImports = mergeImportStatements(allImports);
  const uniqueStatements: any[] = mergeLocalStatements(allDefinitions);

  return [uniqueImports, uniqueStatements];
}

function mergeImportStatements(importStatements: ImportStatement[]): OptionalKind<ImportDeclarationStructure>[] {
  // Group by moduleSpecifier
  const grouped = groupBy(importStatements, 'moduleSpecifier');

  // Merge namedImports uniquely for each group
  return map(grouped, (statements, moduleSpecifier) => {
    const namedImports = uniq(flatMap(statements, 'namedImports').filter(Boolean));
    const defaultImport = find(statements, 'defaultImport')?.defaultImport || undefined;
    const namespaceImport = find(statements, 'namespaceImport')?.namespaceImport || undefined;
    // const isTypeOnly = some(statements, 'isTypeOnly'); todo: probably need to group by this as well

    return {
      moduleSpecifier,
      namedImports: namedImports.length > 0 ? namedImports : undefined,
      defaultImport,
      namespaceImport
    };
  });
}

function mergeLocalStatements(localStatements: LocalStatement[]): LocalStatement[] {
  // Group by type and identifierName
  const grouped = groupBy(localStatements, (statement) => `${statement.type}-${statement.identifierName}`);

  // Construct the merged local statements
  return map(grouped, (statements) => {
    // Assuming we take the first statement's properties for the merged result
    return statements[0];
  });
}
