**[@react-typed-forms/core](../README.md)**

> [Globals](../globals.md) / "core/nodes"

# Module: "core/nodes"

## Index

### Enumerations

* [NodeChange](../enums/_core_nodes_.nodechange.md)

### Classes

* [ArrayControl](../classes/_core_nodes_.arraycontrol.md)
* [BaseControl](../classes/_core_nodes_.basecontrol.md)
* [FormControl](../classes/_core_nodes_.formcontrol.md)
* [GroupControl](../classes/_core_nodes_.groupcontrol.md)
* [ParentControl](../classes/_core_nodes_.parentcontrol.md)

### Interfaces

* [ArrayDef](../interfaces/_core_nodes_.arraydef.md)
* [ControlDef](../interfaces/_core_nodes_.controldef.md)
* [GroupDef](../interfaces/_core_nodes_.groupdef.md)

### Type aliases

* [AllowedDef](_core_nodes_.md#alloweddef)
* [ChangeListener](_core_nodes_.md#changelistener)
* [ControlType](_core_nodes_.md#controltype)
* [ControlValue](_core_nodes_.md#controlvalue)
* [FormDataType](_core_nodes_.md#formdatatype)
* [FormFields](_core_nodes_.md#formfields)
* [GroupControlFields](_core_nodes_.md#groupcontrolfields)
* [GroupControls](_core_nodes_.md#groupcontrols)
* [GroupValues](_core_nodes_.md#groupvalues)
* [ToOptional](_core_nodes_.md#tooptional)
* [UndefinedProperties](_core_nodes_.md#undefinedproperties)

### Functions

* [buildGroup](_core_nodes_.md#buildgroup)
* [control](_core_nodes_.md#control)
* [formArray](_core_nodes_.md#formarray)
* [formGroup](_core_nodes_.md#formgroup)
* [setValueUnsafe](_core_nodes_.md#setvalueunsafe)
* [toValueUnsafe](_core_nodes_.md#tovalueunsafe)

## Type aliases

### AllowedDef

Ƭ  **AllowedDef**<V\>: V *extends* *infer* X[] ? ArrayDef<AllowedDef<X\>\> : V *extends* object ? GroupDef<{}\> : never \| [ControlDef](../interfaces/_core_nodes_.controldef.md)<V\>

*Defined in [packages/core/nodes.ts:565](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L565)*

#### Type parameters:

Name |
------ |
`V` |

___

### ChangeListener

Ƭ  **ChangeListener**<C\>: [[NodeChange](../enums/_core_nodes_.nodechange.md), (control: C, cb: [NodeChange](../enums/_core_nodes_.nodechange.md)) => void]

*Defined in [packages/core/nodes.ts:19](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L19)*

#### Type parameters:

Name | Type |
------ | ------ |
`C` | [BaseControl](../classes/_core_nodes_.basecontrol.md) |

___

### ControlType

Ƭ  **ControlType**<T\>: T *extends* ControlDef<*infer* V\> ? FormControl<V\> : T *extends* ArrayDef<*infer* E\> ? ArrayControl<ControlType<E\>\> : T *extends* GroupDef<*infer* F\> ? GroupControl<{}\> : never

*Defined in [packages/core/nodes.ts:529](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L529)*

#### Type parameters:

Name |
------ |
`T` |

___

### ControlValue

Ƭ  **ControlValue**<T\>: T *extends* FormControl<*infer* V\> ? V : T *extends* ArrayControl<*infer* E\> ? ControlValue<E\>[] : T *extends* GroupControl<*infer* F\> ? ToOptional<{}\> : never

*Defined in [packages/core/nodes.ts:180](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L180)*

#### Type parameters:

Name |
------ |
`T` |

___

### FormDataType

Ƭ  **FormDataType**<DEF\>: [ControlValue](_core_nodes_.md#controlvalue)<[ControlType](_core_nodes_.md#controltype)<DEF\>\>

*Defined in [packages/core/nodes.ts:527](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L527)*

#### Type parameters:

Name |
------ |
`DEF` |

___

### FormFields

Ƭ  **FormFields**<R\>: {}

*Defined in [packages/core/nodes.ts:372](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L372)*

#### Type parameters:

Name |
------ |
`R` |

___

### GroupControlFields

Ƭ  **GroupControlFields**<R\>: [GroupControl](../classes/_core_nodes_.groupcontrol.md)<[FormFields](_core_nodes_.md#formfields)<R\>\>

*Defined in [packages/core/nodes.ts:374](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L374)*

#### Type parameters:

Name |
------ |
`R` |

___

### GroupControls

Ƭ  **GroupControls**<DEF\>: {}

*Defined in [packages/core/nodes.ts:551](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L551)*

#### Type parameters:

Name |
------ |
`DEF` |

___

### GroupValues

Ƭ  **GroupValues**<DEF\>: {}

*Defined in [packages/core/nodes.ts:555](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L555)*

#### Type parameters:

Name |
------ |
`DEF` |

___

### ToOptional

Ƭ  **ToOptional**<T\>: Partial<Pick<T, [UndefinedProperties](_core_nodes_.md#undefinedproperties)<T\>\>\> & Pick<T, Exclude<keyof T, [UndefinedProperties](_core_nodes_.md#undefinedproperties)<T\>\>\>

*Defined in [packages/core/nodes.ts:5](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L5)*

#### Type parameters:

Name |
------ |
`T` |

___

### UndefinedProperties

Ƭ  **UndefinedProperties**<T\>: {}[keyof T]

*Defined in [packages/core/nodes.ts:1](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L1)*

#### Type parameters:

Name |
------ |
`T` |

## Functions

### buildGroup

▸ **buildGroup**<T\>(): function

*Defined in [packages/core/nodes.ts:609](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L609)*

Create a form group function which only accepts
valid definitions that will produce values of given type T.

#### Type parameters:

Name |
------ |
`T` |

**Returns:** function

___

### control

▸ **control**<V\>(`validator?`: (v: V) => string \| undefined \| null): [ControlDef](../interfaces/_core_nodes_.controldef.md)<V\>

*Defined in [packages/core/nodes.ts:577](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L577)*

Define a leaf node containing values of type V

#### Type parameters:

Name |
------ |
`V` |

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`validator?` | (v: V) => string \| undefined \| null | An optional synchronous validator  |

**Returns:** [ControlDef](../interfaces/_core_nodes_.controldef.md)<V\>

___

### formArray

▸ **formArray**<CHILD\>(`child`: CHILD): [ArrayDef](../interfaces/_core_nodes_.arraydef.md)<CHILD\>

*Defined in [packages/core/nodes.ts:585](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L585)*

#### Type parameters:

Name |
------ |
`CHILD` |

#### Parameters:

Name | Type |
------ | ------ |
`child` | CHILD |

**Returns:** [ArrayDef](../interfaces/_core_nodes_.arraydef.md)<CHILD\>

___

### formGroup

▸ **formGroup**<DEF\>(`children`: DEF): [GroupDef](../interfaces/_core_nodes_.groupdef.md)<DEF\>

*Defined in [packages/core/nodes.ts:599](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L599)*

#### Type parameters:

Name | Type |
------ | ------ |
`DEF` | object |

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`children` | DEF |   |

**Returns:** [GroupDef](../interfaces/_core_nodes_.groupdef.md)<DEF\>

___

### setValueUnsafe

▸ **setValueUnsafe**(`ctrl`: [BaseControl](../classes/_core_nodes_.basecontrol.md), `v`: any, `initial?`: undefined \| false \| true): void

*Defined in [packages/core/nodes.ts:166](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L166)*

#### Parameters:

Name | Type |
------ | ------ |
`ctrl` | [BaseControl](../classes/_core_nodes_.basecontrol.md) |
`v` | any |
`initial?` | undefined \| false \| true |

**Returns:** void

___

### toValueUnsafe

▸ **toValueUnsafe**(`ctrl`: [BaseControl](../classes/_core_nodes_.basecontrol.md)): any

*Defined in [packages/core/nodes.ts:170](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L170)*

#### Parameters:

Name | Type |
------ | ------ |
`ctrl` | [BaseControl](../classes/_core_nodes_.basecontrol.md) |

**Returns:** any
