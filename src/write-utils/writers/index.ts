import { CodeBlockWriter } from 'ts-morph';
import { FUNCTION_END, FUNCTION_START, IDENT_END, IDENT_START, LocalStatement } from 'types';
import { getExternalIdentifier, getFunctionDeclaration } from 'utils';

export const MAX_DEPTH = 10;

/**
 * Utility to write a morphed declaration using the CodeBlockWriter
 * @param writer
 * @param obj
 * @param depth
 * @param maxDepth
 */
export function writeReducedDeclaration(writer: CodeBlockWriter, obj: any, depth = 0, maxDepth = MAX_DEPTH) {
  if (depth > maxDepth) {
    throw new Error(`Object exceeds maximum depth of ${maxDepth}. Write better code please`);
  }

  if (obj instanceof Array) {
    writer.write('[');
    writer.newLine();
    writer.indent(() => {
      obj.forEach((value, index, array) => {
        writeReducedDeclaration(writer, value, depth + 1, maxDepth);
        if (index < array.length - 1) {
          writer.write(',');
        }
        writer.newLine();
      });
    });
    writer.write(']');
    return;
  }

  if (obj === null) {
    writer.write('null');
    return;
  }

  if (obj === undefined) {
    writer.write('undefined');
    return;
  }

  if (typeof obj !== 'object') {
    if (typeof obj === 'string' && obj.startsWith(FUNCTION_START) && obj.endsWith(FUNCTION_END)) {
      writer.write(getFunctionDeclaration(obj));
      return;
    }

    if (typeof obj === 'string' && obj.startsWith(IDENT_START) && obj.endsWith(IDENT_END)) {
      writer.write(getExternalIdentifier(obj));
      return;
    }

    writer.write(JSON.stringify(obj));
    return;
  }

  writer.write('{');
  writer.newLine();
  writer.indent(() => {
    Object.entries(obj).forEach(([key, value], index, array) => {
      writer.write(`${key}: `);
      writeReducedDeclaration(writer, value, depth + 1, maxDepth);
      if (index < array.length - 1) {
        writer.write(',');
      }
      writer.newLine();
    });
  });
  writer.write('}');
}

/**
 * Utility to write local statements using the CodeBlockWriter
 * @param writer
 * @param localStatements
 */
export function writeLocalStatements(writer: CodeBlockWriter, localStatements: LocalStatement[]) {
  localStatements.forEach((statement) => {
    if (statement.type === 'const' || statement.type === 'let' || statement.type === 'var') {
      writer.write(`export ${statement.type} ${statement.value};`);
      writer.newLine();
    } else {
      if (statement.value.includes('export')) writer.write(`${statement.value}`);
      else writer.write(`export ${statement.value}`);
      writer.newLine();
    }
  });
}
