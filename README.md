# morph-declaration-to-raw

## Overview

A `ts-morph` utility for transforming a Typescript AST node into a JS structure in memory.
Useful for modifying or reading specific values from an object in a Typescript AST.

Originally, I wrote this as a way to generate an api-client, and be able to expose the validation configuration to it
without exposing the internal api structure.

## Installation

```
npm install morph-declaration-to-raw --dev
```

```
yarn add -D morph-declaration-to-raw
```

## Usage

```typescript
import { reduceDeclarationToPrimitive, writeReducedDeclaration, writeExternals } from 'morph-declaration-to-raw';

// context is used for external import declarations, to keep track of what has already been imported
const context = [];

const [valueOne, externalsOne] = reduceDeclarationToPrimitive(someNode, project, context, {
  omit: [keyToOmit], // any object keys you want to omit
  resolveImports: true, // will populate the externalsOne array with import declarations from node_modules
  reduceEnums: true,
  ignoreFunctions: false
});

const [valueTwo, externalsTwo] = reduceDeclarationToPrimitive(someOtherNode, project, context, {});

console.info(valueOne.propertyOne); // the object is "evaled" into memory

valueOne.propertyTwo = 'new value'; // you can modify before writing it to file

// merge externals declaration so imports are not duplicated
const externals = new Set([...externalsOne, ...externalsTwo]);

// write the imports/externals to the source file
writeExternals(externals, sourceFile);

// write the reduced declarations to the source file
sourceFile.addVariableStatement({
  declarationKind: VariableDeclarationKind.Const,
  declarations: [
    {
      name: 'VALUE_ONE',
      initializer: (writer) => writeReducedDeclaration(writer, valueOne, 0, 10),
      type: 'YOUR_TYPE'
    },
    {
      name: 'VALUE_TWO',
      type: 'YOUR_TYPE',
      initializer: (writer) => writeReducedDeclaration(writer, valueTwo, 0, 6)
    }
  ]
});
```

## Caveats
- This package still has some limitations, so use with caution.
- `this` is not supported in every context
- If a declaration depends on an external import, like a value from `node_modules`, that value will not be morphed,
but instead added to the externals array. You can then write the externals to the source file with `writeExternals`.
- Functions are saved as strings and the writer utilities in the package will be able to write them back to file.
You can eval the functions if you really, really need to, but I would not recommend it. eval is slow, and the functions may
depend on variables/other functions outside their scope.
