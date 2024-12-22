export type ReferenceContext = string[];

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

export const FUNCTION_START = 'Function[' as const;
export const FUNCTION_END = ']Function' as const;

export const IDENT_START = 'Ident[' as const;
export const IDENT_END = ']Ident' as const;
