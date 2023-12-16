export const isFunction = (value) => typeof value === 'function'
export const isClass = (value) => isFunction(value) && /^\s*class/.test(value.toString())
export const isArrowFunction = (value) => isFunction(value) && value.toString().includes('=>') && !value.prototype?.constructor
