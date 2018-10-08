//logs.js
import util from '../../utils/util.js'
import { page } from '../../libs/omina.js'
const app = getApp()

page({
  mapData: {
    logs(app) {
      return app.globalData.logs.map(log =>
        util.formatTime(new Date(log))
      )
    }
  },
  data: { },
  onLoad: function (options) {
    app.showModal({ title: `上一页面传参${JSON.stringify(options.params)}` })
  },
  onBack() {
    app.navigateBack({ delta: 1 })
      .then(_ => this.$prevPage.onBack())
  }
})
