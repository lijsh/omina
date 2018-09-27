import { nextTick } from '../utils'
const app = getApp()
const watcherQueue = []
let has = {}
const pageMap = {}

function flushSchedulerQueue() {
  Object.keys(pageMap).forEach(route => {
    const map = pageMap[route]
    const data = map.expQueue.reduce((ret, cur) => {
      ret[cur.key] = cur.exp(app)
      return ret
    }, {})
    map.page.setData(data)
  })
  has = {}
  watcherQueue.length = 0
}

export function queueWatcher(watcher) {
  const id = watcher.id
  if (has[id]) return
  has[id] = true
  const { ctx: page, exp, key } = watcher
  const { route } = page
  pageMap[route] = pageMap[route] || {
    page,
    expQueue: []
  }
  pageMap[route].expQueue.push({ exp, key })
  if (watcherQueue.push(watcher) === 1) {
    nextTick(flushSchedulerQueue)
  }
}
