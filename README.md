# ts-morph-utils

## Overview

A set of utilities to use with `ts-morph`.
This package is still in its infancy, so there are some limitations, possible bugs with
the utilities exposed by the package.a Not directly affiliated with `ts-morph`.

## Installation

```
npm install ts-morph-utils --dev
```

```
yarn add -D ts-morph-utils
```

## Utilities

### `morphDeclarationToRaw`

Transforms a TypeScript declaration into its raw value.
Useful in case you want to manipulate the object before writing it back to file.

**Options**:

- _omit_: any object keys you wish to omit from the transformed object
- _resolveImports_: whether to resolve imports. Passing `false` will simply `null` any external declarations which can't be reduced.
- _reduceEnums_: reduce enums or not. Passing `false` will add the enums to the externals as local statements.
- _ignoreFunctions_: passing `false` will replace function declarations with `null`

### `getPropertyFromConstructor`

Retrieves a property from a class constructor.

### `getPropertyInInheritance`

Finds a property in a class inheritance chain.

### `getMethodInInheritance`

Finds a method in a class inheritance chain.

### `externalsToWritableDeclarations`

Converts external definitions to writable declarations.

### `resolveExternalImport`

Resolves an external import statement for a given identifier.

### `resolveExternalNodes`

Resolves external nodes within a declaration.

### `resolveIdentifierValue`

Returns a writable local statement and it's dependencies for a given identifier

### `writeReducedDeclaration`

Writes a reduced declaration to a source file.

### `writeLocalStatements`

Writes local statements to a source file.

### `writeImports`

Writes import declarations to a source file.

### `writeExternals`

Writes external definitions to a source file.

### `writeStatements`

Writes statements to a source file.

### `getFunctionDeclaration`

Retrieves a function declaration from a morphed string.

### `getExternalIdentifier`

Gets an external identifier from a morphed string.

## Usage

Example usage of some of the utilities.

```typescript
import { reduceDeclarationToPrimitive, writeReducedDeclaration, writeExternals } from 'ts-morph-utils';

// context is used for external import declarations, to keep track of what has already been imported
const context = [];

const [valueOne, externalsOne] = reduceDeclarationToPrimitive(someNode, project, context, {
  omit: [keyToOmit], // any object keys you want to omit
  resolveImports: true, // will populate the externalsOne array with import declarations from node_modules
  reduceEnums: true,
  ignoreFunctions: false
});

const [valueTwo, externalsTwo] = reduceDeclarationToPrimitive(someOtherNode, project, context, {});

// the object is "evaled" into memory, so you can just read it's values
console.info(typeof valueOne.propertyOne === 'number');

// you can modify before writing it to file
valueOne.propertyTwo = 'new value';

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
