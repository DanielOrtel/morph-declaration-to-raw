import { ImportDeclarationStructure, OptionalKind, SourceFile } from 'ts-morph';
import { LocalStatement, ExternalDefinition } from 'types';
import { writeLocalStatements } from 'write-utils/writers';
import { externalsToWritableDeclarations } from 'write-utils/handle-externals';

/**
 * Writes external values received when morphing a node to raw value to a source file
 * @param statements
 * @param sourceFile
 */
export function writeStatements(statements: LocalStatement[], sourceFile: SourceFile) {
  sourceFile.addStatements((writer) => writeLocalStatements(writer, statements));
}

/**
 * Writes imports received when morphing a node to raw value to a source file
 * @param imports
 * @param sourceFile
 */
export function writeImports(imports: OptionalKind<ImportDeclarationStructure>[], sourceFile: SourceFile) {
  sourceFile.addImportDeclarations(imports);
}

/**
 * Writes externals to a source file
 * @param externals
 * @param sourceFile
 */
export function writeExternals(externals: ExternalDefinition, sourceFile: SourceFile) {
  const [imports, statements] = externalsToWritableDeclarations(externals);

  writeStatements(statements, sourceFile);
  writeImports(imports, sourceFile);
}
