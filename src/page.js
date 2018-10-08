import { set, del } from './observe/index'
import { Watcher } from './observe/watcher'
import mitt from 'mitt'
const emitter = mitt()

export default function page(config) {
  const { onLoad: originalOnload, onUnload: originalOnUnload, mapData } = config
  config.onLoad = function onLoad(onLoadOptions) {
    const pages = getCurrentPages()
    this.$prevPage = pages[pages.length - 2]
    if (this.$prevPage) {
      onLoadOptions.params = this.$prevPage.$nextPageParams
      delete this.$prevPage.$nextPageParams
    }
    if (mapData) {
      Object.keys(mapData).forEach(key => {
        const fn = mapData[key]
        new Watcher(this, _ => {
          const ret = fn(getApp())
          this.setData({
            [key]: ret
          })
          return ret
        }, { isMapStateWatcher: true, exp: fn, key })
      })
    }
    Object.defineProperties(this, {
      '$app': {
        get: getApp
      },
    })
    if (originalOnload) originalOnload.call(this, onLoadOptions)
  }
  config.$navTo = function ({ url, params }) {
    this.__params = params
    wx.navigateTo({ url })
  }

  config.$on = function $on(evt, cb) {
    if (typeof cb !== 'function') return
    this.events = this.events || Object.create(null)
    this.events[evt] = this.events[evt] || []
    this.events[evt].push(cb)
    return emitter.on(evt, cb)
  }

  config.$emit = function $emit(event, ...args) {
    return emitter.emit(event, ...args)
  }

  config.$set = set
  config.$del = del

  config.onUnload = function () {
    // teardown watcher
    if (Array.isArray(this.$watchers)) {
      this.$watchers.forEach(watcher => {
        watcher.teardown()
      })
    }
    delete this.$watchers
    // detach event cb
    Object.keys(this.events).forEach(evt => {
      const cbs = this.events[evt]
      cbs.forEach(cb => {
        emitter.off(evt, cb)
      })
    })
    if (originalOnUnload) originalOnUnload.call(this)
  }
  return Page(config)
}
