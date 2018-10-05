import promisify from 'promisify-wxa'
import { set, del, observe } from './observe/index'
import mitt from 'mitt'

export default function wxApp(config) {
  const { onLaunch: originalOnLaunch } = config
  config.onLaunch = function(...args) {
    promisify(this)
    this.globalData = this.globalData || {}
    observe(this.globalData)
    if (originalOnLauch) originalOnLaunch.bind(this)(...args)
  }

  config.bus = mitt()

  config.set = set

  config.del = del

  return App(config)
}
