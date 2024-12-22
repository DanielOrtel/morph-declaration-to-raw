# morph-declaration-to-raw

## Overview

A `ts-morph` utility for transforming a Typescript AST node into a JS structure in memory.
Useful for modifying or reading specific values from an object in

## Installation

```
npm install morph-declaration-to-raw --dev
```

```
yarn add -D morph-declaration-to-raw
```

## Usage

```typescript
import {
  reduceDeclarationToPrimitive,
  writeReducedDeclaration,
  writeExternals,
  evalFunctionDeclaration
} from 'morph-declaration-to-raw';

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

// functions are essentially strings that will be written to the file, but you can access them directly
// by evaling them:
const myFunc = evalFunctionDeclaration(valueOne.functionDeclaration);

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
