import path from 'path';
import { describe, expect, test } from 'vitest';
import { Project } from 'ts-morph';
import { morphDeclarationToRaw } from 'reduce-value';

describe('morphDeclarationToRaw', () => {
  const project = new Project({
    tsConfigFilePath: path.resolve(process.cwd(), 'tsconfig.test.json')
  });

  const testFile = project.getSourceFileOrThrow('./tests/test-project/index.ts');

  const testObject = testFile.getVariableDeclarationOrThrow('TEST_OBJECT');

  const context: string[] = [];
  const [rawObject, externals] = morphDeclarationToRaw(testObject, project, context, {
    omit: ['omitted'],
    resolveImports: true,
    reduceEnums: true,
    ignoreFunctions: false
  });

  test('It handles primitive values', () => {
    expect(rawObject.deepObject.deep.string).toEqual('string');
    expect(rawObject.deepObject.deep.number).toEqual(1);
    expect(rawObject.deepObject.deep.boolean).toEqual(true);
    expect(rawObject.deepObject.deep.null).toEqual(null);
    expect(rawObject.deepObject.deep.someArray).toStrictEqual([3, 4, 5]);
    expect(rawObject.deepObject.deep.literal).toEqual('literal');
  });

  test('It handles shorthand assignments', () => {
    expect(rawObject.shorthand).toEqual('short');
  });

  test('It handles as expressions', () => {
    expect(rawObject.asExpression).toEqual(123);
  });

  test('It omits specified properties', () => {
    expect(rawObject).not.toHaveProperty('omitted');
  });

  test('It resolves external functions', () => {
    expect(rawObject.externalFunc).contains('Function[');
    expect(rawObject.externalFunc).contains('[1, 2, 3]');
    expect(rawObject.externalFunc).contains(']Function');
    expect(rawObject.externalFunc).contains('shuffle');
    expect(
      [...externals].some(
        (external) => external.originalIdentifier === 'shuffle' && (external as any).moduleSpecifier === 'lodash'
      )
    ).toBe(true);
  });

  test('It resolves functions without substituting params', () => {
    expect(rawObject.externalFuncTwo).contains('params: any[]');
    expect(rawObject.funcThree).contains('param * 2');
  });

  test('reduces local values accessed directly', () => {
    expect(rawObject.reducedLocalValue.someValue).toEqual(123);
  });

  test('reduces enum values accessed directly', () => {
    expect(rawObject.enum).toEqual('b');
  });

  test('handles spread operation properly', () => {
    expect(rawObject.spread.c).toEqual('c');
    expect(rawObject.spread.d).toEqual('d');
    expect(rawObject.spread).not.toHaveProperty('omitted');
  });
});
