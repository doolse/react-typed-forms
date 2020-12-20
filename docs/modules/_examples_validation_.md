**[@react-typed-forms/core](../README.md)**

> [Globals](../globals.md) / "examples/validation"

# Module: "examples/validation"

## Index

### Type aliases

* [ValidationForm](_examples_validation_.md#validationform)

### Variables

* [FormDef](_examples_validation_.md#formdef)
* [emailRegExp](_examples_validation_.md#emailregexp)
* [renders](_examples_validation_.md#renders)

### Functions

* [ValidationExample](_examples_validation_.md#validationexample)

## Type aliases

### ValidationForm

Ƭ  **ValidationForm**: { async: string ; email: string  }

*Defined in [packages/examples/validation.tsx:10](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/examples/validation.tsx#L10)*

#### Type declaration:

Name | Type |
------ | ------ |
`async` | string |
`email` | string |

## Variables

### FormDef

• `Const` **FormDef**: GroupDef<{ async: ControlDef<string\> = control(null); email: ControlDef<string\> = control((v) =\> (!emailRegExp.test(v) ? "Invalid email address" : "")) }\> = buildGroup<ValidationForm\>()({ email: control((v) =\> (!emailRegExp.test(v) ? "Invalid email address" : "")), async: control(null),})

*Defined in [packages/examples/validation.tsx:17](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/examples/validation.tsx#L17)*

___

### emailRegExp

• `Const` **emailRegExp**: RegExp = /^[a-zA-Z0-9.!#$%&'*+/=?^\_\`{\|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

*Defined in [packages/examples/validation.tsx:15](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/examples/validation.tsx#L15)*

___

### renders

• `Let` **renders**: number = 0

*Defined in [packages/examples/validation.tsx:22](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/examples/validation.tsx#L22)*

## Functions

### ValidationExample

▸ **ValidationExample**(): Element

*Defined in [packages/examples/validation.tsx:24](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/examples/validation.tsx#L24)*

**Returns:** Element
