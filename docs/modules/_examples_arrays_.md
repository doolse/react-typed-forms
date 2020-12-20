**[@react-typed-forms/core](../README.md)**

> [Globals](../globals.md) / "examples/arrays"

# Module: "examples/arrays"

## Index

### Type aliases

* [MainForm](_examples_arrays_.md#mainform)

### Variables

* [FormDef](_examples_arrays_.md#formdef)
* [renders](_examples_arrays_.md#renders)

### Functions

* [ArraysExample](_examples_arrays_.md#arraysexample)

## Type aliases

### MainForm

Ƭ  **MainForm**: { strings: string[] ; structured: { id: string ; name: string  }[]  }

*Defined in [packages/examples/arrays.tsx:11](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/examples/arrays.tsx#L11)*

#### Type declaration:

Name | Type |
------ | ------ |
`strings` | string[] |
`structured` | { id: string ; name: string  }[] |

## Variables

### FormDef

• `Const` **FormDef**: GroupDef<{ strings: ArrayDef<ControlDef<string\>\> = formArray(control()); structured: ArrayDef<GroupDef<{ id: ControlDef<string\> = control(); name: ControlDef<string\> = control() }\>\> = formArray(formGroup({ id: control(), name: control() })) }\> = buildGroup<MainForm\>()({ strings: formArray(control()), structured: formArray(formGroup({ id: control(), name: control() })),})

*Defined in [packages/examples/arrays.tsx:19](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/examples/arrays.tsx#L19)*

___

### renders

• `Let` **renders**: number = 0

*Defined in [packages/examples/arrays.tsx:24](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/examples/arrays.tsx#L24)*

## Functions

### ArraysExample

▸ **ArraysExample**(): Element

*Defined in [packages/examples/arrays.tsx:26](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/examples/arrays.tsx#L26)*

**Returns:** Element
