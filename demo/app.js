import { app } from './libs/omina'

//app.js
app({
  onLaunch: function () {
    // 展示本地存储能力
    var logs = this.getStorageSync('logs') || []
    logs.unshift(Date.now())
    this.setStorageSync('logs', logs)
    this.set(this.globalData, 'logs', logs)

    // 登录
    this.login()
      .then(res => {
        console.log(res.code)// 发送 res.code 到后台换取 openId, sessionKey, unionId
      })
    // 获取用户信息
    this.getSetting()
      .then(res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          this.getUserInfo()
            .then(res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 globalData 中的数据变化会引发页面 data 的自动更新，因此此处不再需要定义相应的回调
            })
        }
      })
  },
  globalData: {
    userInfo: null
  }
})
