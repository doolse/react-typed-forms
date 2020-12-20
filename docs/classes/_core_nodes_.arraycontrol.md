**[@react-typed-forms/core](../README.md)**

> [Globals](../globals.md) / ["core/nodes"](../modules/_core_nodes_.md) / ArrayControl

# Class: ArrayControl<FIELD\>

## Type parameters

Name | Type |
------ | ------ |
`FIELD` | [BaseControl](_core_nodes_.basecontrol.md) |

## Hierarchy

* [ParentControl](_core_nodes_.parentcontrol.md)

  ↳ **ArrayControl**

## Index

### Constructors

* [constructor](_core_nodes_.arraycontrol.md#constructor)

### Properties

* [childDefinition](_core_nodes_.arraycontrol.md#childdefinition)
* [dirty](_core_nodes_.arraycontrol.md#dirty)
* [disabled](_core_nodes_.arraycontrol.md#disabled)
* [elems](_core_nodes_.arraycontrol.md#elems)
* [error](_core_nodes_.arraycontrol.md#error)
* [initialValueLength](_core_nodes_.arraycontrol.md#initialvaluelength)
* [stateVersion](_core_nodes_.arraycontrol.md#stateversion)
* [touched](_core_nodes_.arraycontrol.md#touched)
* [valid](_core_nodes_.arraycontrol.md#valid)

### Methods

* [addChangeListener](_core_nodes_.arraycontrol.md#addchangelistener)
* [addFormElement](_core_nodes_.arraycontrol.md#addformelement)
* [clearErrors](_core_nodes_.arraycontrol.md#clearerrors)
* [lookupControl](_core_nodes_.arraycontrol.md#lookupcontrol)
* [removeChangeListener](_core_nodes_.arraycontrol.md#removechangelistener)
* [removeFormElement](_core_nodes_.arraycontrol.md#removeformelement)
* [setDisabled](_core_nodes_.arraycontrol.md#setdisabled)
* [setError](_core_nodes_.arraycontrol.md#seterror)
* [setTouched](_core_nodes_.arraycontrol.md#settouched)
* [setValue](_core_nodes_.arraycontrol.md#setvalue)
* [toArray](_core_nodes_.arraycontrol.md#toarray)
* [validate](_core_nodes_.arraycontrol.md#validate)
* [visitChildren](_core_nodes_.arraycontrol.md#visitchildren)

## Constructors

### constructor

\+ **new ArrayControl**(`childDefinition`: any): [ArrayControl](_core_nodes_.arraycontrol.md)

*Defined in [packages/core/nodes.ts:378](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L378)*

#### Parameters:

Name | Type |
------ | ------ |
`childDefinition` | any |

**Returns:** [ArrayControl](_core_nodes_.arraycontrol.md)

## Properties

### childDefinition

• `Private` **childDefinition**: any

*Defined in [packages/core/nodes.ts:380](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L380)*

___

### dirty

•  **dirty**: boolean = false

*Inherited from [BaseControl](_core_nodes_.basecontrol.md).[dirty](_core_nodes_.basecontrol.md#dirty)*

*Defined in [packages/core/nodes.ts:29](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L29)*

___

### disabled

•  **disabled**: boolean = false

*Inherited from [BaseControl](_core_nodes_.basecontrol.md).[disabled](_core_nodes_.basecontrol.md#disabled)*

*Defined in [packages/core/nodes.ts:28](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L28)*

___

### elems

•  **elems**: FIELD[] = []

*Defined in [packages/core/nodes.ts:377](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L377)*

___

### error

•  **error**: string \| undefined \| null

*Inherited from [BaseControl](_core_nodes_.basecontrol.md).[error](_core_nodes_.basecontrol.md#error)*

*Defined in [packages/core/nodes.ts:26](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L26)*

___

### initialValueLength

•  **initialValueLength**: number = 0

*Defined in [packages/core/nodes.ts:378](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L378)*

___

### stateVersion

•  **stateVersion**: number = 0

*Inherited from [BaseControl](_core_nodes_.basecontrol.md).[stateVersion](_core_nodes_.basecontrol.md#stateversion)*

*Defined in [packages/core/nodes.ts:35](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L35)*

___

### touched

•  **touched**: boolean = false

*Inherited from [BaseControl](_core_nodes_.basecontrol.md).[touched](_core_nodes_.basecontrol.md#touched)*

*Defined in [packages/core/nodes.ts:27](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L27)*

___

### valid

•  **valid**: boolean = true

*Inherited from [BaseControl](_core_nodes_.basecontrol.md).[valid](_core_nodes_.basecontrol.md#valid)*

*Defined in [packages/core/nodes.ts:25](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L25)*

## Methods

### addChangeListener

▸ **addChangeListener**(`listener`: (node: this, change: [NodeChange](../enums/_core_nodes_.nodechange.md)) => void, `mask?`: [NodeChange](../enums/_core_nodes_.nodechange.md)): void

*Inherited from [BaseControl](_core_nodes_.basecontrol.md).[addChangeListener](_core_nodes_.basecontrol.md#addchangelistener)*

*Defined in [packages/core/nodes.ts:147](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L147)*

#### Parameters:

Name | Type |
------ | ------ |
`listener` | (node: this, change: [NodeChange](../enums/_core_nodes_.nodechange.md)) => void |
`mask?` | [NodeChange](../enums/_core_nodes_.nodechange.md) |

**Returns:** void

___

### addFormElement

▸ **addFormElement**(`value`: [ControlValue](../modules/_core_nodes_.md#controlvalue)<FIELD\>): FIELD

*Defined in [packages/core/nodes.ts:445](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L445)*

Add a new element to the array

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`value` | [ControlValue](../modules/_core_nodes_.md#controlvalue)<FIELD\> | The value for the child control  |

**Returns:** FIELD

___

### clearErrors

▸ **clearErrors**(): void

*Inherited from [ParentControl](_core_nodes_.parentcontrol.md).[clearErrors](_core_nodes_.parentcontrol.md#clearerrors)*

*Defined in [packages/core/nodes.ts:344](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L344)*

Clear all error messages and mark controls as valid.

**Returns:** void

___

### lookupControl

▸ **lookupControl**(`path`: (string \| number)[]): [BaseControl](_core_nodes_.basecontrol.md) \| null

*Inherited from [ParentControl](_core_nodes_.parentcontrol.md).[lookupControl](_core_nodes_.parentcontrol.md#lookupcontrol)*

*Defined in [packages/core/nodes.ts:354](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L354)*

Lookup a child control give an array of control path elements.
A path element is either a string property name for GroupControl
or an index number for ArrayControl.

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`path` | (string \| number)[] |   |

**Returns:** [BaseControl](_core_nodes_.basecontrol.md) \| null

___

### removeChangeListener

▸ **removeChangeListener**(`listener`: (node: this, change: [NodeChange](../enums/_core_nodes_.nodechange.md)) => void): void

*Inherited from [BaseControl](_core_nodes_.basecontrol.md).[removeChangeListener](_core_nodes_.basecontrol.md#removechangelistener)*

*Defined in [packages/core/nodes.ts:157](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L157)*

#### Parameters:

Name | Type |
------ | ------ |
`listener` | (node: this, change: [NodeChange](../enums/_core_nodes_.nodechange.md)) => void |

**Returns:** void

___

### removeFormElement

▸ **removeFormElement**(`index`: number): void

*Defined in [packages/core/nodes.ts:456](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L456)*

Remove an element in the array by index

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`index` | number | The index of the form element to remove  |

**Returns:** void

___

### setDisabled

▸ **setDisabled**(`disabled`: boolean): void

*Inherited from [ParentControl](_core_nodes_.parentcontrol.md).[setDisabled](_core_nodes_.parentcontrol.md#setdisabled)*

*Defined in [packages/core/nodes.ts:322](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L322)*

Set the disabled flag on this and all children.

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`disabled` | boolean |   |

**Returns:** void

___

### setError

▸ **setError**(`error?`: string \| null): void

*Inherited from [BaseControl](_core_nodes_.basecontrol.md).[setError](_core_nodes_.basecontrol.md#seterror)*

*Defined in [packages/core/nodes.ts:161](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L161)*

#### Parameters:

Name | Type |
------ | ------ |
`error?` | string \| null |

**Returns:** void

___

### setTouched

▸ **setTouched**(`touched`: boolean): void

*Inherited from [ParentControl](_core_nodes_.parentcontrol.md).[setTouched](_core_nodes_.parentcontrol.md#settouched)*

*Overrides [BaseControl](_core_nodes_.basecontrol.md).[setTouched](_core_nodes_.basecontrol.md#settouched)*

*Defined in [packages/core/nodes.ts:330](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L330)*

Set the touched flag on this and any children.

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`touched` | boolean |   |

**Returns:** void

___

### setValue

▸ **setValue**(`value`: [ControlValue](../modules/_core_nodes_.md#controlvalue)<FIELD\>[], `initial?`: undefined \| false \| true): void

*Defined in [packages/core/nodes.ts:390](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L390)*

Set the child values. Underlying nodes will be
added/deleted if the size of the array changes.

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`value` | [ControlValue](../modules/_core_nodes_.md#controlvalue)<FIELD\>[] | The values to set on child nodes |
`initial?` | undefined \| false \| true | If true reset the dirty flag  |

**Returns:** void

___

### toArray

▸ **toArray**(): [ControlValue](../modules/_core_nodes_.md#controlvalue)<FIELD\>[]

*Defined in [packages/core/nodes.ts:420](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L420)*

**Returns:** [ControlValue](../modules/_core_nodes_.md#controlvalue)<FIELD\>[]

___

### validate

▸ **validate**(): void

*Inherited from [ParentControl](_core_nodes_.parentcontrol.md).[validate](_core_nodes_.parentcontrol.md#validate)*

*Defined in [packages/core/nodes.ts:337](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L337)*

Run validation listeners for this and any children.

**Returns:** void

___

### visitChildren

▸ **visitChildren**(`visit`: (c: [BaseControl](_core_nodes_.basecontrol.md)) => boolean, `doSelf?`: undefined \| false \| true, `recurse?`: undefined \| false \| true): boolean

*Overrides void*

*Defined in [packages/core/nodes.ts:424](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L424)*

#### Parameters:

Name | Type |
------ | ------ |
`visit` | (c: [BaseControl](_core_nodes_.basecontrol.md)) => boolean |
`doSelf?` | undefined \| false \| true |
`recurse?` | undefined \| false \| true |

**Returns:** boolean
