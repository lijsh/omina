import { page } from '../../libs/omina'

//index.js
//获取应用实例
const app = getApp()

page({
  mapData: {
    userInfo(app) {
      return app.globalData.userInfo
    },
    hasUserInfo(app) {
      return !!app.globalData.userInfo
    }
  },
  data: {
    motto: 'Hello World',
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },
  //事件处理函数
  bindViewTap: function() {
    this.$navTo({ url: '../logs/logs', params: { foo: 'bar' } })
      .then(console.log)
  },
  onLoad: function () {},
  getUserInfo: function(e) {
    app.globalData.userInfo = e.detail.userInfo
  },
  onBack() {
    app.showToast({ title: '$prevPage调用' })
  }
})
