export { morphDeclarationToRaw } from './reduce-value';
export { getPropertyFromConstructor, getPropertyInInheritance, getMethodInInheritance } from './class-properties';
export { externalsToWritableDeclarations } from './external-declarations/handle-externals';
export {
  resolveExternalImport,
  resolveExternalNodes,
  resolveIdentifierValue
} from './external-declarations/resolve-external-nodes';
export { writeMorphedDeclaration, writeLocalStatements } from './write-utils/writers';
export { writeExternals, writeImports, writeStatements } from './write-utils/write-externals';
export { getFunctionDeclaration, getExternalIdentifier } from './utils';
export * from './types';
