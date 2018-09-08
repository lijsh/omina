function wxPage(config) {
  const { onLoad } = config
  config.onLoad = function onLoad(onLoadOptions) {
    const pages = getCurrentPages()
    this.$prevPage = pages.slice().pop()
    if (this.$prevPage) {
      onLoadOptions.params = this.$prevPage.$nextPageParams
      delete this.$prevPage.$nextPageParams
    }
    if (typeof onLoad === 'function') {
      onLoad.call(this, onLoadOptions)
    }
  }
  config.$navigateTo = function $navigateTo({ url, params }) {
    this.$nextPageParams = params
    wx.navigateTo({ url })
  }
  return Page(config)
}

export default wxPage