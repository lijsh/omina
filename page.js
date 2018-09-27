import { set, del } from './observe/index'
import { Watcher } from './observe/watcher'
import mitt from 'mitt'

const app = getApp()

export default function page(config) {
  const { onLoad, onUnload, mapState } = config
  config.onLoad = function onLoad(onLoadOptions) {
    const pages = getCurrentPages()
    this.$prevPage = pages.slice().pop()
    if (this.$prevPage) {
      onLoadOptions.params = this.$prevPage.$nextPageParams
      delete this.$prevPage.$nextPageParams
    }
    if (mapState) {
      Object.keys(mapState).forEach(key => {
        const fn = mapState[key]
        new Watcher(this, _ => {
          const ret = fn(app)
          this.setData({
            [key]: ret
          })
          return ret
        }, { isMapStateWatcher: true, exp: fn, key })
      })
    }
    if (onLoad) onLoad.call(this, onLoadOptions)
  }
  config.$navigateTo = function $navigateTo({ url, params }) {
    this.$nextPageParams = params
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
    if (onUnload) onUnload.call(this)
  }
  return Page(config)
}
