import { remove } from '../utils'

let uid = 0

export class Dep {
  static target = null
  constructor() {
    this.id = ++uid
    this.subs = []
  }

  depend() {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  addSub(sub) {
    this.subs.push(sub)
  }

  removeSub(sub) {
    remove(this.subs, sub)
  }

  notify() {
    const subs = this.subs.slice()
    subs.forEach(sub => sub.update())
  }
}

const targetStack = []

export function pushTarget(_target) {
  if (Dep.target) targetStack.push(Dep.target)
  Dep.target = _target
}

export function popTarget() {
  Dep.target = targetStack.pop()
}
