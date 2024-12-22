import { ImportDeclarationStructure, OptionalKind, SourceFile } from 'ts-morph';
import { LocalStatement, ExternalDefinition } from 'types';
import { writeLocalStatements } from 'write-utils/writers';
import { externalsToWritableDeclarations } from 'write-utils/handle-externals';

export function writeStatements(statements: LocalStatement[], sourceFile: SourceFile) {
  sourceFile.addStatements((writer) => writeLocalStatements(writer, statements));
}

export function writeImports(imports: OptionalKind<ImportDeclarationStructure>[], sourceFile: SourceFile) {
  sourceFile.addImportDeclarations(imports);
}

export function writeExternals(externals: ExternalDefinition, sourceFile: SourceFile) {
  const [imports, statements] = externalsToWritableDeclarations(externals);

  writeStatements(statements, sourceFile);
  writeImports(imports, sourceFile);
}
