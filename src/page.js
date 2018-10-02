import { set, del } from './observe/index'
import { Watcher } from './observe/watcher'

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
      '$bus': {
        get() {
          return getApp().bus
        }
      }
    })
    if (originalOnload) originalOnload.call(this, onLoadOptions)
  }
  config.$navTo = function ({ url, params }) {
    this.__params = params
    wx.navigateTo({ url })
  }

  config.$set = set
  config.$del = del

  config.onUnload = function () {
    if (Array.isArray(this.$watchers)) {
      this.$watchers.forEach(watcher => {
        watcher.teardown()
      })
    }
    delete this.$watchers
    if (originalOnUnload) originalOnUnload.call(this)
  }
  return Page(config)
}
