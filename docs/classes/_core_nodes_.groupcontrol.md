**[@react-typed-forms/core](../README.md)**

> [Globals](../globals.md) / ["core/nodes"](../modules/_core_nodes_.md) / GroupControl

# Class: GroupControl<FIELDS\>

## Type parameters

Name | Type |
------ | ------ |
`FIELDS` | { [k:string]: [BaseControl](_core_nodes_.basecontrol.md);  } |

## Hierarchy

* [ParentControl](_core_nodes_.parentcontrol.md)

  ↳ **GroupControl**

## Index

### Constructors

* [constructor](_core_nodes_.groupcontrol.md#constructor)

### Properties

* [dirty](_core_nodes_.groupcontrol.md#dirty)
* [disabled](_core_nodes_.groupcontrol.md#disabled)
* [error](_core_nodes_.groupcontrol.md#error)
* [fields](_core_nodes_.groupcontrol.md#fields)
* [stateVersion](_core_nodes_.groupcontrol.md#stateversion)
* [touched](_core_nodes_.groupcontrol.md#touched)
* [valid](_core_nodes_.groupcontrol.md#valid)

### Methods

* [addChangeListener](_core_nodes_.groupcontrol.md#addchangelistener)
* [clearErrors](_core_nodes_.groupcontrol.md#clearerrors)
* [lookupControl](_core_nodes_.groupcontrol.md#lookupcontrol)
* [removeChangeListener](_core_nodes_.groupcontrol.md#removechangelistener)
* [setDisabled](_core_nodes_.groupcontrol.md#setdisabled)
* [setError](_core_nodes_.groupcontrol.md#seterror)
* [setTouched](_core_nodes_.groupcontrol.md#settouched)
* [setValue](_core_nodes_.groupcontrol.md#setvalue)
* [toObject](_core_nodes_.groupcontrol.md#toobject)
* [validate](_core_nodes_.groupcontrol.md#validate)
* [visitChildren](_core_nodes_.groupcontrol.md#visitchildren)

## Constructors

### constructor

\+ **new GroupControl**(`children`: FIELDS, `v`: [GroupValues](../modules/_core_nodes_.md#groupvalues)<FIELDS\>): [GroupControl](_core_nodes_.groupcontrol.md)

*Defined in [packages/core/nodes.ts:465](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L465)*

#### Parameters:

Name | Type |
------ | ------ |
`children` | FIELDS |
`v` | [GroupValues](../modules/_core_nodes_.md#groupvalues)<FIELDS\> |

**Returns:** [GroupControl](_core_nodes_.groupcontrol.md)

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

### fields

•  **fields**: FIELDS

*Defined in [packages/core/nodes.ts:465](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L465)*

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

▸ **setValue**(`value`: [ToOptional](../modules/_core_nodes_.md#tooptional)<{}\>, `initial?`: undefined \| false \| true): void

*Defined in [packages/core/nodes.ts:505](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L505)*

Set the value of all child nodes.
If the child type contains `undefined` the fields is optional.

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`value` | [ToOptional](../modules/_core_nodes_.md#tooptional)<{}\> | The value for all child nodes |
`initial?` | undefined \| false \| true | If true reset the dirty flag  |

**Returns:** void

___

### toObject

▸ **toObject**(): object

*Defined in [packages/core/nodes.ts:517](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L517)*

**Returns:** object

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

*Defined in [packages/core/nodes.ts:479](https://github.com/doolse/react-typed-form/blob/2a3f260/packages/core/nodes.ts#L479)*

#### Parameters:

Name | Type |
------ | ------ |
`visit` | (c: [BaseControl](_core_nodes_.basecontrol.md)) => boolean |
`doSelf?` | undefined \| false \| true |
`recurse?` | undefined \| false \| true |

**Returns:** boolean
