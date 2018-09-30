import { set, del } from './observe/index'
import { Watcher } from './observe/watcher'
import mitt from 'mitt'

export default function page(config) {
  const { onLoad: originalOnload, onUnload: originalOnUnload, mapState } = config
  config.onLoad = function onLoad(onLoadOptions) {
    const pages = getCurrentPages()
    this.$prevPage = pages[pages.length - 2]
    if (this.$prevPage) {
      onLoadOptions.params = this.$prevPage.$nextPageParams
      delete this.$prevPage.$nextPageParams
    }
    if (mapState) {
      Object.keys(mapState).forEach(key => {
        const fn = mapState[key]
        new Watcher(this, _ => {
          const ret = fn(getApp())
          this.setData({
            [key]: ret
          })
          return ret
        }, { isMapStateWatcher: true, exp: fn, key })
      })
    }
    if (originalOnload) originalOnload.call(this, onLoadOptions)
  }
  config.$navTo = function ({ url, params }) {
    this.__params = params
    wx.navigateTo({ url })
  }

  config.$set = set
  config.$del = del
  config.$bus = mitt()

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
