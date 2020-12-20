**[@react-typed-forms/core](../README.md)**

> [Globals](../globals.md) / ["core/nodes"](../modules/_core_nodes_.md) / BaseControl

# Class: BaseControl

## Hierarchy

* **BaseControl**

  ↳ [FormControl](_core_nodes_.formcontrol.md)

  ↳ [ParentControl](_core_nodes_.parentcontrol.md)

## Index

### Properties

* [dirty](_core_nodes_.basecontrol.md#dirty)
* [disabled](_core_nodes_.basecontrol.md#disabled)
* [error](_core_nodes_.basecontrol.md#error)
* [stateVersion](_core_nodes_.basecontrol.md#stateversion)
* [touched](_core_nodes_.basecontrol.md#touched)
* [valid](_core_nodes_.basecontrol.md#valid)

### Methods

* [addChangeListener](_core_nodes_.basecontrol.md#addchangelistener)
* [removeChangeListener](_core_nodes_.basecontrol.md#removechangelistener)
* [setError](_core_nodes_.basecontrol.md#seterror)
* [setTouched](_core_nodes_.basecontrol.md#settouched)

## Properties

### dirty

•  **dirty**: boolean = false

*Defined in [packages/core/nodes.ts:29](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L29)*

___

### disabled

•  **disabled**: boolean = false

*Defined in [packages/core/nodes.ts:28](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L28)*

___

### error

•  **error**: string \| undefined \| null

*Defined in [packages/core/nodes.ts:26](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L26)*

___

### stateVersion

•  **stateVersion**: number = 0

*Defined in [packages/core/nodes.ts:35](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L35)*

___

### touched

•  **touched**: boolean = false

*Defined in [packages/core/nodes.ts:27](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L27)*

___

### valid

•  **valid**: boolean = true

*Defined in [packages/core/nodes.ts:25](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L25)*

## Methods

### addChangeListener

▸ **addChangeListener**(`listener`: (node: this, change: [NodeChange](../enums/_core_nodes_.nodechange.md)) => void, `mask?`: [NodeChange](../enums/_core_nodes_.nodechange.md)): void

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

*Defined in [packages/core/nodes.ts:157](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L157)*

#### Parameters:

Name | Type |
------ | ------ |
`listener` | (node: this, change: [NodeChange](../enums/_core_nodes_.nodechange.md)) => void |

**Returns:** void

___

### setError

▸ **setError**(`error?`: string \| null): void

*Defined in [packages/core/nodes.ts:161](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L161)*

#### Parameters:

Name | Type |
------ | ------ |
`error?` | string \| null |

**Returns:** void

___

### setTouched

▸ `Abstract`**setTouched**(`showValidation`: boolean): void

*Defined in [packages/core/nodes.ts:54](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L54)*

#### Parameters:

Name | Type |
------ | ------ |
`showValidation` | boolean |

**Returns:** void
