## Omina
> 一个简约的小程序增强库，提供了全局状态同步及增强的小程序原生对象（`Page` 实例及 `App` 实例）。

## 特点
- 轻量：聚焦 framework free 的原生开发，仅 12kb 大小，只包含必要的逻辑及两个蝇量级依赖 :)
- 全局状态响应式同步：fork 了 Vue 中 observe 的逻辑，实现了页面 `data` 与 `globalData` 的同步
- 集成 event emitter：依赖 `mitt` 实现了全局及跨页面的 event emitter
- 增强的 `Page` 实例及 `App` 实例
- `wx` 接口的 promisify

## 使用方法
- 将 [dist/omina.min.js]() (或 [dist/omina.js]()) 复制到项目相应目录中，如 `libs/omina.js`，然后引用：
``` js
import { page } from 'libs/omina'

page({
  onLoad(options) {}
})
```
- `omina` 也支持通过 `npm install omina` 安装为项目依赖，最后通过开发工具自带 npm 构建功能或打包工具（Webpack、Rollup 等）的构建功能将 `omina` 打包到 build 中。
``` js
import { app } from 'omina'

app({
  onLaunch() {}
})
```
## API
`omina` 暂时只暴露 `page` 及 `app` 两个 API，`Page` 与 `App` 的增强、`globalData` 的 observe、`wx` 接口的 promisify 均由 `omina` 在内部实现。

## 页面实例属性及方法
- **$prevPage**

获取上一页的页面对象，在一些只涉及到两个页面的跨页面通讯中比较好用。

- **$bus** （暂不推荐使用，因不会自动清除事件回调）

所有页面对象（通过 `page` 生成的页面对象）都集成了同一个微型事件总线（event emitter），方便实现跨页面通信。

- **`mapData`**

`mapData` 是页面 `data` 与 `globalData` 保持同步的关键，`mapData` 对象中 key 的值均为函数，最终会定义为 page `data` 中对应的 key，当 key 函数中依赖的 `globalData` 发生变动，`omina` 会自动
``` js
import { page } from 'omina'


page({
  mapData: {
    userInfo(app) {
      return app.globalData.userInfo // 假设 app.globalData.userInfo 初始值为 null
    }
  }
  onLoad() {
    console.log(this.data.userInfo) // null
    app.globalData.userInfo = { nickName: 'Omina' } // next tick 后 this.data.userInfo 变成 { nickName: 'Omina' }
  }
})

```

- **$navTo({ url, params })**

跳转到 `url` 指定页面，同时传递 `params` 参数，此参数可在下一页的 `onLoad` 中取回：
``` js
// A 跳转 B
page({
  onLoad() {
    this.$navTo({ url: 'urlToB', params: { foo: 'bar' } })
  }
})

// B 页面的 onLoad
page({
  onLoad(options) {
    console.log(options.params) // { foo: 'bar' }
  }
})
```
## 全局对象实例属性及方法
`App` 实例上代理了 'wx' 对象上的 API，其中回调风格的 API 均进行了 promisify：
``` js
import { app } from 'omina'

app({
  onLaunch() {
    this.login()
      .then(res => {
        console.log(res.code)
      })
  }
})
```

- **bus**

`App` 实例上的 `bus` 属性是 `mitt` 实现的全局单例事件总线，具体 API 请参考 [mitt](https://github.com/developit/mitt)
## TODO
- `Component` 的增强
-  支持 `Computed` 属性
- `request` 方法的增强

具体实现可参考这篇文章：https://juejin.im/post/5b55c1056fb9a04f951d1d4b

