import { FUNCTION_END, FUNCTION_START, IDENT_END, IDENT_START } from 'types';

export function stringBetweenStrings(startStr: string, endStr: string, str: string) {
  const pos = str.indexOf(startStr) + startStr.length;
  return str.substring(pos, str.indexOf(endStr, pos));
}

/**
 * Extracts the function declaration from a string in morphed value
 * @param func
 */
export function getFunctionDeclaration(func: string): string {
  if (typeof func !== 'string' || !func.startsWith(FUNCTION_START) || !func.endsWith(FUNCTION_END)) {
    throw new Error(
      `Invalid function declaration: ${func}. All functions transformed by reduceDeclarationToPrimitive should be scoped with Function[code-here]Function`
    );
  }

  return stringBetweenStrings(FUNCTION_START, FUNCTION_END, func);
}

/**
 * Extracts the external identifier from a string in morphed value
 * @param func
 */
export function getExternalIdentifier(func: string): string {
  if (typeof func !== 'string' || !func.startsWith(IDENT_START) || !func.endsWith(IDENT_END)) {
    throw new Error(
      `Invalid external identifier: ${func}. All identifiers transformed by reduceDeclarationToPrimitive should be scoped with ${IDENT_START}code-here${IDENT_END}`
    );
  }

  return stringBetweenStrings(IDENT_START, IDENT_END, func);
}
