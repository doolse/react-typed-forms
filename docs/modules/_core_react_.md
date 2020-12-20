**[@react-typed-forms/core](../README.md)**

> [Globals](../globals.md) / "core/react"

# Module: "core/react"

## Index

### Interfaces

* [FormArrayProps](../interfaces/_core_react_.formarrayprops.md)
* [FormValidAndDirtyProps](../interfaces/_core_react_.formvalidanddirtyprops.md)

### Type aliases

* [FinputProps](_core_react_.md#finputprops)
* [FselectProps](_core_react_.md#fselectprops)

### Functions

* [Finput](_core_react_.md#finput)
* [FormArray](_core_react_.md#formarray)
* [FormValidAndDirty](_core_react_.md#formvalidanddirty)
* [Fselect](_core_react_.md#fselect)
* [useAsyncValidator](_core_react_.md#useasyncvalidator)
* [useChangeListener](_core_react_.md#usechangelistener)
* [useFormListener](_core_react_.md#useformlistener)
* [useFormListenerComponent](_core_react_.md#useformlistenercomponent)
* [useFormState](_core_react_.md#useformstate)
* [useFormStateVersion](_core_react_.md#useformstateversion)

## Type aliases

### FinputProps

Ƭ  **FinputProps**: InputHTMLAttributes<HTMLInputElement\> & { state: [FormControl](../classes/_core_nodes_.formcontrol.md)<string \| number\>  }

*Defined in [packages/core/react.tsx:141](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/react.tsx#L141)*

___

### FselectProps

Ƭ  **FselectProps**: SelectHTMLAttributes<HTMLSelectElement\> & { state: [FormControl](../classes/_core_nodes_.formcontrol.md)<string \| number\>  }

*Defined in [packages/core/react.tsx:174](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/react.tsx#L174)*

## Functions

### Finput

▸ **Finput**(`__namedParameters`: { others: others ; state: [FormControl](../classes/_core_nodes_.formcontrol.md)<string \| number\>  }): Element

*Defined in [packages/core/react.tsx:145](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/react.tsx#L145)*

#### Parameters:

Name | Type |
------ | ------ |
`__namedParameters` | { others: others ; state: [FormControl](../classes/_core_nodes_.formcontrol.md)<string \| number\>  } |

**Returns:** Element

___

### FormArray

▸ **FormArray**<C\>(`__namedParameters`: { children: (elems: C[]) => ReactNode ; state: [ArrayControl](../classes/_core_nodes_.arraycontrol.md)<C\>  }): Element

*Defined in [packages/core/react.tsx:72](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/react.tsx#L72)*

#### Type parameters:

Name | Type |
------ | ------ |
`C` | [BaseControl](../classes/_core_nodes_.basecontrol.md) |

#### Parameters:

Name | Type |
------ | ------ |
`__namedParameters` | { children: (elems: C[]) => ReactNode ; state: [ArrayControl](../classes/_core_nodes_.arraycontrol.md)<C\>  } |

**Returns:** Element

___

### FormValidAndDirty

▸ **FormValidAndDirty**(`__namedParameters`: { children: (validForm: boolean) => ReactElement ; state: [BaseControl](../classes/_core_nodes_.basecontrol.md)  }): ReactElement<any, string \| (props: P) => ReactElement \| null \| {}\>

*Defined in [packages/core/react.tsx:58](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/react.tsx#L58)*

#### Parameters:

Name | Type |
------ | ------ |
`__namedParameters` | { children: (validForm: boolean) => ReactElement ; state: [BaseControl](../classes/_core_nodes_.basecontrol.md)  } |

**Returns:** ReactElement<any, string \| (props: P) => ReactElement \| null \| {}\>

___

### Fselect

▸ **Fselect**(`__namedParameters`: { children: ReactNode ; others: others ; state: [FormControl](../classes/_core_nodes_.formcontrol.md)<string \| number\>  }): Element

*Defined in [packages/core/react.tsx:178](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/react.tsx#L178)*

#### Parameters:

Name | Type |
------ | ------ |
`__namedParameters` | { children: ReactNode ; others: others ; state: [FormControl](../classes/_core_nodes_.formcontrol.md)<string \| number\>  } |

**Returns:** Element

___

### useAsyncValidator

▸ **useAsyncValidator**<C\>(`node`: C, `validator`: (node: C, abortSignal: AbortSignal) => Promise<string \| null \| undefined\>, `delay`: number): void

*Defined in [packages/core/react.tsx:97](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/react.tsx#L97)*

#### Type parameters:

Name | Type |
------ | ------ |
`C` | [BaseControl](../classes/_core_nodes_.basecontrol.md) |

#### Parameters:

Name | Type |
------ | ------ |
`node` | C |
`validator` | (node: C, abortSignal: AbortSignal) => Promise<string \| null \| undefined\> |
`delay` | number |

**Returns:** void

___

### useChangeListener

▸ **useChangeListener**<Node\>(`control`: Node, `listener`: (node: Node, change: [NodeChange](../enums/_core_nodes_.nodechange.md)) => void, `mask?`: [NodeChange](../enums/_core_nodes_.nodechange.md), `deps?`: any[]): void

*Defined in [packages/core/react.tsx:80](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/react.tsx#L80)*

#### Type parameters:

Name | Type |
------ | ------ |
`Node` | [BaseControl](../classes/_core_nodes_.basecontrol.md) |

#### Parameters:

Name | Type |
------ | ------ |
`control` | Node |
`listener` | (node: Node, change: [NodeChange](../enums/_core_nodes_.nodechange.md)) => void |
`mask?` | [NodeChange](../enums/_core_nodes_.nodechange.md) |
`deps?` | any[] |

**Returns:** void

___

### useFormListener

▸ **useFormListener**<C, S\>(`control`: C, `toState`: (state: C) => S, `mask?`: [NodeChange](../enums/_core_nodes_.nodechange.md)): S

*Defined in [packages/core/react.tsx:15](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/react.tsx#L15)*

#### Type parameters:

Name | Type |
------ | ------ |
`C` | [BaseControl](../classes/_core_nodes_.basecontrol.md) |
`S` | - |

#### Parameters:

Name | Type |
------ | ------ |
`control` | C |
`toState` | (state: C) => S |
`mask?` | [NodeChange](../enums/_core_nodes_.nodechange.md) |

**Returns:** S

___

### useFormListenerComponent

▸ **useFormListenerComponent**<S, C\>(`control`: C, `toState`: (state: C) => S, `mask?`: [NodeChange](../enums/_core_nodes_.nodechange.md)): FC<{ children: (formState: S) => ReactElement  }\>

*Defined in [packages/core/react.tsx:39](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/react.tsx#L39)*

#### Type parameters:

Name | Type |
------ | ------ |
`S` | - |
`C` | [BaseControl](../classes/_core_nodes_.basecontrol.md) |

#### Parameters:

Name | Type |
------ | ------ |
`control` | C |
`toState` | (state: C) => S |
`mask?` | [NodeChange](../enums/_core_nodes_.nodechange.md) |

**Returns:** FC<{ children: (formState: S) => ReactElement  }\>

___

### useFormState

▸ **useFormState**<FIELDS\>(`group`: [GroupDef](../interfaces/_core_nodes_.groupdef.md)<FIELDS\>, `value`: [ToOptional](_core_nodes_.md#tooptional)<[GroupValues](_core_nodes_.md#groupvalues)<FIELDS\>\>, `dontValidate?`: undefined \| false \| true): [GroupControl](../classes/_core_nodes_.groupcontrol.md)<[GroupControls](_core_nodes_.md#groupcontrols)<FIELDS\>\>

*Defined in [packages/core/react.tsx:25](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/react.tsx#L25)*

#### Type parameters:

Name | Type |
------ | ------ |
`FIELDS` | object |

#### Parameters:

Name | Type |
------ | ------ |
`group` | [GroupDef](../interfaces/_core_nodes_.groupdef.md)<FIELDS\> |
`value` | [ToOptional](_core_nodes_.md#tooptional)<[GroupValues](_core_nodes_.md#groupvalues)<FIELDS\>\> |
`dontValidate?` | undefined \| false \| true |

**Returns:** [GroupControl](../classes/_core_nodes_.groupcontrol.md)<[GroupControls](_core_nodes_.md#groupcontrols)<FIELDS\>\>

___

### useFormStateVersion

▸ **useFormStateVersion**(`control`: [BaseControl](../classes/_core_nodes_.basecontrol.md), `mask?`: [NodeChange](../enums/_core_nodes_.nodechange.md)): number

*Defined in [packages/core/react.tsx:93](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/react.tsx#L93)*

#### Parameters:

Name | Type |
------ | ------ |
`control` | [BaseControl](../classes/_core_nodes_.basecontrol.md) |
`mask?` | [NodeChange](../enums/_core_nodes_.nodechange.md) |

**Returns:** number
