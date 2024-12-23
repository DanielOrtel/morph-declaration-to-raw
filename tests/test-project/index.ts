import { shuffle } from 'lodash';

const shorthand = 'short';
const reduced = 123;

// eslint-disable-next-line no-restricted-syntax
enum test {
  a = 'a',
  b = 'b'
}

const testObject = {
  c: 'c',
  d: 'd',
  e: 'e',
  omitted: 'ommited'
};

export const TEST_OBJECT = {
  shorthand,
  deepObject: {
    deep: {
      string: 'string',
      number: 1,
      boolean: true,
      null: null,
      someArray: [3, 4, 5],
      literal: `literal`
    }
  },
  reducedLocalValue: {
    someValue: reduced
  },
  asExpression: 123 as unknown as number,
  externalFunc: shuffle([1, 2, 3]),
  externalFuncTwo: (params: any[]) => shuffle(params),
  funcThree: function (param: number) {
    return param * 2;
  },
  funcFour: () => {
    return reduced;
  },
  omitted: 'should be ommited',
  enum: test.b,
  spread: {
    ...testObject
  },
  propertyAccess: testObject.d
};
