import { pushTarget, popTarget } from './dep'
import { queueWatcher } from './schedule'

let uid = 0

export class Watcher {
  constructor(ctx, fn, options) {
    this.ctx = ctx
    ctx.$watchers = (ctx.$watchers || []).concat(this)
    this.getter = fn
    this.id = ++uid
    this.deps = []
    this.depIds = new Set()
    this.value = this.get()
    if (options) {
      this.isMapStateWatcher = !!options.isMapStateWatcher
      this.exp = options.exp
      this.key = options.key
    } else {
      throw new Error('小程序环境 watcher 必须提供 options')
    }
  }
  get() {
    pushTarget(this)
    let value = this.getter()
    popTarget()
    return value
  }

  update() {
    queueWatcher(this)
  }

  run() {
    // 小程序环境因为要合并 watcher 队列中的 data 一次性执行 setData，因为不再逐一调用 watcher 的 run
  }

  addDep(dep) {
    const id = dep.id
    if (!this.depIds.has(id)) {
      this.depIds.add(id)
      this.deps.push(dep)
      dep.addSub(this)
    }
  }

  teardown() {
    let i = this.deps.length
    while (i--) {
      this.deps[i].removeSub(this)
    }
  }
}
