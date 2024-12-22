import { reduceDeclarationToPrimitive } from 'reduce-value';

export { reduceDeclarationToPrimitive } from './reduce-value';
export {
  getPropertyFromConstructor,
  getPropertyInInheritance,
  getMethodInInheritance
} from './reduce-value/properties';
export { externalsToWritableDeclarations } from './write-utils/handle-externals';
export { writeReducedDeclaration } from './write-utils/writers';
export { writeExternals, writeImports, writeStatements } from './write-utils/write-externals';
export {
  getFunctionDeclaration,
  getExternalIdentifier,
  evalExternalIdentifier,
  evalFunctionDeclaration
} from './utils';
export * from './types';

export default reduceDeclarationToPrimitive;
