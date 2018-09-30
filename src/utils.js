export function def(obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  })
}

const hasOwnProperty = Object.prototype.hasOwnProperty

export function hasOwn(obj, key) {
  return hasOwnProperty.call(obj, key)
}

const _toString = Object.prototype.toString

export function isPlainObject(obj) {
  return _toString.call(obj) === '[object Object]'
}

export function isValidArrayIndex(val) {
  const n = parseFloat(String(val))
  return n >= 0 && Math.floor(n) === n && isFinite(val)
}

export function remove(arr, item) {
  if (arr.length) {
    const idx = arr.indexOf(item)
    if (idx > -1) {
      return arr.splice(idx, 1)
    }
  }
}

export const nextTick = wx.nextTick ? wx.nextTick : setTimeout

export function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
