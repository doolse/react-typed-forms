**[@react-typed-forms/core](../README.md)**

> [Globals](../globals.md) / ["core/nodes"](../modules/_core_nodes_.md) / FormControl

# Class: FormControl<V\>

## Type parameters

Name |
------ |
`V` |

## Hierarchy

* [BaseControl](_core_nodes_.basecontrol.md)

  ↳ **FormControl**

## Index

### Constructors

* [constructor](_core_nodes_.formcontrol.md#constructor)

### Properties

* [dirty](_core_nodes_.formcontrol.md#dirty)
* [disabled](_core_nodes_.formcontrol.md#disabled)
* [error](_core_nodes_.formcontrol.md#error)
* [initialValue](_core_nodes_.formcontrol.md#initialvalue)
* [stateVersion](_core_nodes_.formcontrol.md#stateversion)
* [touched](_core_nodes_.formcontrol.md#touched)
* [valid](_core_nodes_.formcontrol.md#valid)
* [value](_core_nodes_.formcontrol.md#value)

### Methods

* [addChangeListener](_core_nodes_.formcontrol.md#addchangelistener)
* [removeChangeListener](_core_nodes_.formcontrol.md#removechangelistener)
* [setDisabled](_core_nodes_.formcontrol.md#setdisabled)
* [setError](_core_nodes_.formcontrol.md#seterror)
* [setTouched](_core_nodes_.formcontrol.md#settouched)
* [setValue](_core_nodes_.formcontrol.md#setvalue)
* [validate](_core_nodes_.formcontrol.md#validate)
* [visitChildren](_core_nodes_.formcontrol.md#visitchildren)

## Constructors

### constructor

\+ **new FormControl**(`value`: V, `validator?`: (v: V) => string \| undefined \| null \| null): [FormControl](_core_nodes_.formcontrol.md)

*Defined in [packages/core/nodes.ts:189](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L189)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | V |
`validator?` | (v: V) => string \| undefined \| null \| null |

**Returns:** [FormControl](_core_nodes_.formcontrol.md)

## Properties

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

### error

•  **error**: string \| undefined \| null

*Inherited from [BaseControl](_core_nodes_.basecontrol.md).[error](_core_nodes_.basecontrol.md#error)*

*Defined in [packages/core/nodes.ts:26](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L26)*

___

### initialValue

•  **initialValue**: V

*Defined in [packages/core/nodes.ts:189](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L189)*

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

___

### value

•  **value**: V

*Defined in [packages/core/nodes.ts:192](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L192)*

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

### setDisabled

▸ **setDisabled**(`disabled`: boolean): void

*Defined in [packages/core/nodes.ts:240](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L240)*

Set the disabled flag.

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

*Overrides [BaseControl](_core_nodes_.basecontrol.md).[setTouched](_core_nodes_.basecontrol.md#settouched)*

*Defined in [packages/core/nodes.ts:248](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L248)*

Set the touched flag.

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`touched` | boolean |   |

**Returns:** void

___

### setValue

▸ **setValue**(`value`: V, `initial?`: undefined \| false \| true): void

*Defined in [packages/core/nodes.ts:213](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L213)*

Set the value for this control and
update the dirty flag if changed.

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`value` | V | The value to set |
`initial?` | undefined \| false \| true | If true the dirty flag is reset and a copy of the value is kept to check for dirtiness on any future updates.  |

**Returns:** void

___

### validate

▸ **validate**(): void

*Defined in [packages/core/nodes.ts:255](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L255)*

Run validation listeners.

**Returns:** void

___

### visitChildren

▸ **visitChildren**(`visit`: (c: [BaseControl](_core_nodes_.basecontrol.md)) => boolean, `doSelf?`: undefined \| false \| true, `recurse?`: undefined \| false \| true): boolean

*Overrides void*

*Defined in [packages/core/nodes.ts:228](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L228)*

#### Parameters:

Name | Type |
------ | ------ |
`visit` | (c: [BaseControl](_core_nodes_.basecontrol.md)) => boolean |
`doSelf?` | undefined \| false \| true |
`recurse?` | undefined \| false \| true |

**Returns:** boolean
