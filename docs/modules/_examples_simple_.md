**[@react-typed-forms/core](../README.md)**

> [Globals](../globals.md) / "examples/simple"

# Module: "examples/simple"

## Index

### Type aliases

* [SimpleForm](_examples_simple_.md#simpleform)

### Variables

* [FormDef](_examples_simple_.md#formdef)

### Functions

* [SimpleExample](_examples_simple_.md#simpleexample)

## Type aliases

### SimpleForm

Ƭ  **SimpleForm**: { firstName: string ; lastName: string  }

*Defined in [packages/examples/simple.tsx:10](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/examples/simple.tsx#L10)*

#### Type declaration:

Name | Type |
------ | ------ |
`firstName` | string |
`lastName` | string |

## Variables

### FormDef

• `Const` **FormDef**: GroupDef<{ firstName: ControlDef<string\> = control(); lastName: ControlDef<string\> = control((v) =\> (!v ? "Required field" : undefined)) }\> = buildGroup<SimpleForm\>()({ firstName: control(), lastName: control((v) =\> (!v ? "Required field" : undefined)),})

*Defined in [packages/examples/simple.tsx:15](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/examples/simple.tsx#L15)*

## Functions

### SimpleExample

▸ **SimpleExample**(): Element

*Defined in [packages/examples/simple.tsx:20](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/examples/simple.tsx#L20)*

**Returns:** Element
