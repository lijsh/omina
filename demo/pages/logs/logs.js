//logs.js
import util from '../../utils/util.js'
import { page } from '../../libs/omina.js'

page({
  mapData: {
    logs(app) {
      return app.globalData.logs.map(log => 
        util.formatTime(new Date(log))
      )
    }
  },
  data: { },
  onLoad: function () { }
})
