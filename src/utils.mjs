export const isFunction = (value) => typeof value === 'function'
export const isClass = (value) => isFunction(value) && /^\s*class/.test(value.toString())
export const isPlainObject = (value) => Object.getPrototypeOf(value) === Object.prototype
export const isArrowFunction = (value) => isFunction(value) && value.toString().includes('=>') && !value.prototype?.constructor
