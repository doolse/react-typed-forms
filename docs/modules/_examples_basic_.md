**[@react-typed-forms/core](../README.md)**

> [Globals](../globals.md) / "examples/basic"

# Module: "examples/basic"

## Index

### Type aliases

* [SimpleForm](_examples_basic_.md#simpleform)

### Variables

* [FormDef](_examples_basic_.md#formdef)
* [renders](_examples_basic_.md#renders)

### Functions

* [BasicFormExample](_examples_basic_.md#basicformexample)

## Type aliases

### SimpleForm

Ƭ  **SimpleForm**: { number: string ; password: string ; username: string  }

*Defined in [packages/examples/basic.tsx:10](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/examples/basic.tsx#L10)*

#### Type declaration:

Name | Type |
------ | ------ |
`number` | string |
`password` | string |
`username` | string |

## Variables

### FormDef

• `Const` **FormDef**: GroupDef<{ number: ControlDef<string\> = control(); password: ControlDef<string\> = control((v) =\>
    v.length < 6 ? "Password must be 6 characters" : undefined
  ); username: ControlDef<string\> = control((v) =\> (!v ? "Required field" : undefined)) }\> = buildGroup<SimpleForm\>()({ password: control((v) =\> v.length < 6 ? "Password must be 6 characters" : undefined ), username: control((v) =\> (!v ? "Required field" : undefined)), number: control(),})

*Defined in [packages/examples/basic.tsx:16](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/examples/basic.tsx#L16)*

___

### renders

• `Let` **renders**: number = 0

*Defined in [packages/examples/basic.tsx:24](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/examples/basic.tsx#L24)*

## Functions

### BasicFormExample

▸ **BasicFormExample**(): Element

*Defined in [packages/examples/basic.tsx:26](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/examples/basic.tsx#L26)*

**Returns:** Element
