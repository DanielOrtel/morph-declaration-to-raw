import { morphDeclarationToRaw } from 'reduce-value';

export { morphDeclarationToRaw } from './reduce-value';
export {
  getPropertyFromConstructor,
  getPropertyInInheritance,
  getMethodInInheritance
} from './reduce-value/properties';
export { externalsToWritableDeclarations} from './write-utils/handle-externals';
export { writeReducedDeclaration, writeLocalStatements } from './write-utils/writers';
export { writeExternals, writeImports, writeStatements } from './write-utils/write-externals';
export { getFunctionDeclaration, getExternalIdentifier } from './utils';
export * from './types';

export default morphDeclarationToRaw;
