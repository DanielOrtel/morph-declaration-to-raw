export type ReferenceContext = string[];

export interface Reduce

export interface ImportStatement {
  type: 'importStatement';
  originalIdentifier: string;
  identifierName: string;
  moduleSpecifier: string;
  namedImports?: string[];
  defaultImport?: string | null;
  namespaceImport?: string | null;
  isTypeOnly: boolean;
}

export interface LocalStatement {
  type: 'const' | 'let' | 'var' | 'function' | 'class' | 'interface' | 'type' | 'enum';
  originalIdentifier: string;
  identifierName: string;
  value: string;
  module: string;
}

export type ExternalDefinition = Set<ImportStatement | LocalStatement>;

export const DEFAULT_IMPORTS = new Set<ImportStatement>([
  {
    type: 'importStatement',
    originalIdentifier: 'ValidationSchema',
    identifierName: 'ValidationSchema',
    moduleSpecifier: '@mumush-libraries/common',
    namedImports: ['ValidationSchema'],
    isTypeOnly: true
  }
]);
