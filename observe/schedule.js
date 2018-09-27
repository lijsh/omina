import { nextTick } from '../utils'
const watcherQueue = []
let has = {}
const pageMap = {}

function flushSchedulerQueue() {
  Object.keys(pageMap).forEach(route => {
    const map = pageMap[route]
    const data = map.expQueue.reduce((ret, cur) => {
      ret[cur.key] = cur.exp(getApp())
      return ret
    }, {})
    map.ctx.setData(data)
  })
  has = {}
  watcherQueue.length = 0
}

export function queueWatcher(watcher) {
  const id = watcher.id
  if (has[id]) return
  has[id] = true
  const { ctx, exp, key } = watcher
  const { route } = ctx
  pageMap[route] = pageMap[route] || {
    ctx,
    expQueue: []
  }
  pageMap[route].expQueue.push({ exp, key })
  if (watcherQueue.push(watcher) === 1) {
    nextTick(flushSchedulerQueue)
  }
}
