import { Dep } from './dep'
import { arrayMethods } from './array'
import { def, hasOwn, isPlainObject, isValidArrayIndex } from '../utils'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

function copyAugment(target, src, keys) {
  keys.forEach(key => {
    def(target, key, src[key])
  })
}

export class Observer {
  constructor(value) {
    this.value = value
    this.dep = new Dep
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      copyAugment(value, arrayMethods, arrayKeys)
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }

  walk(obj) {
    Object.keys(obj).forEach(key => {
      defineReactive(obj, key)
    })
  }

  observeArray(items) {
    items.forEach(item => observe(item))
  }
}

export function observe(data) {
  if (!data || typeof data !== 'object') return
  let ob
  if (hasOwn(data, '__ob__') && data.__ob__ instanceof Observer) {
    ob = data.__ob__
  } else if (
    (Array.isArray(data) || isPlainObject(data)) &&
    Object.isExtensible(data)
  ) {
    ob = new Observer(data)
  }
  return ob
}

function defineReactive(data, key) {
  const dep = new Dep
  let val = data[key]
  let childOb = observe(val)
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: false,
    get() {
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(val)) {
            dependArray(val)
          }
        }
      }
      return val
    },
    set(newValue) {
      if (val === newValue) return
      val = newValue
      childOb = observe(val)
      dep.notify()
    }
  })
}

function dependArray(value) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}

export function set(target, key, val) {
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }

  const ob = target.__ob__
  if (!ob) {
    target[key] = val
    return val
  }
  defineReactive(ob.value, key, val)
  ob.dep.notify()
  return val
}

export function del(target, key) {
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  if (hasOwn(target, key)) return
  const ob = target.__ob__
  delete target[key]
  if (!ob) return
  ob.dep.notify()
}
