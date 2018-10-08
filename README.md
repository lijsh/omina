## Omina
> 一个简约的小程序增强库，提供了全局状态同步及增强的小程序原生对象（`Page` 实例及 `App` 实例）。

## 特点
- 轻量：聚焦 framework free 的原生开发，大小不到 10Kb，只包含必要的逻辑及两个蝇量级依赖 :)
- 全局状态响应式同步：fork 了 Vue 中 observe 的逻辑，实现了页面 `data` 与 `globalData` 的同步
- 集成事件总线
- 增强的 `Page` 实例及 `App` 实例
- `wx` 接口的 promisify

## 使用方法
- 将 [dist/omina.min.js](https://github.com/lijsh/omina/blob/master/dist/omina.min.js) (或 [dist/omina.js](https://github.com/lijsh/omina/blob/master/dist/omina.js)) 复制到项目相应目录中，如 `libs/omina.js`，然后引用：
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
- **`mapData`**

`mapData` 属性作为配置选项传进 `page` 函数，是页面 `data` 与 `globalData` 保持同步的关键。`mapData` 对象中 key 的值均为函数，最终会定义为 page 中 `data` 上对应的 key，当 key 函数中依赖的 `globalData` 字段发生变动，`omina` 会自动调用 `setData` 更新对应的 `data`：
``` js
import { page } from 'omina'

page({
  mapData: {
    // this.data.userInfo 会与 app.globalData.userInfo 保持同步
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
`mapData` 建立的数据同步是跨页面的，只要页面还保留在页面栈中没卸载，修改 `globalData` 会触发页面对应 `data` 的修改。

不过直接修改 `globalData` 不利于代码复用与封装，`omina` 在  `App` 实例中暴露了一个事件总线，你可以充分利用自定义事件机制来达成类似 `Vuex` 的效果：
``` js
import { app } from 'omina'
app({
  onLaunch() {
    app.bus.on('foo', (data) => {
      app.set(app.globalData, 'foo', data)
    })
  }
})

// 在某页面调用
app.bus.emit('foo', { testFoo: 'testFoo' })
```

- **$prevPage**

获取上一页的页面对象，在一些只涉及到两个页面的跨页面通讯中用起来更方便。
``` js
// Page A
page({
  data: {
    foo: 'bar'
  },
  methodsA() {
    console.log('这是 A 页面的方法')
  }
})

// Page B；假设由 A 跳转到 B
page({
  data: {},
  onLoad() {
    console.log(this.$prevPage.data) // 打印出 Page A 的 data 属性，即 { foo: 'bar' }
    this.$prevPage.methodsA() // 打印出 '这是 A 页面的方法'
  }
})
```

- **$navTo({ url, params })**

跳转到 `url` 指定页面，同时传递 `params` 参数，此参数可在下一页的 `onLoad` 中取回：
``` js
// A 跳转 B
page({
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

- $on / $emit

所有页面对象（通过 `omina` 的 `page` 方法生成的页面对象）都集成了同一个事件总线，这个事件总线为页面对象增加了 `$on` 及 `$emit` 方法，方便实现跨页面通信。这个事件总线与 `App` 实例上的 `bus` **不是**同一个对象。

``` js
// Page A 中定义
this.$on('test', console.log)

// 跳转到 Page B
this.$emit('test', { foo: 'bar' }) // log 出 { foo: 'bar' }

```
`omina` 会在页面 unload 的时候自动清除当前页面监听的事件，如果不希望事件监听被自动清除，请使用 `App` 上的 `bus`。

总结一下，在 `omina` 中实现跨页面数据传输的方法有三种：
1. 通过 `mapData` 将页面数据与 `globalData` 绑定，修改 `globalData` 时所有对被修改属性有依赖的页面自动 `setData`
2. 使用 `$prevPage` 属性获取上一页面的 `data` 及调用上一页面的方法
3. 使用 `$on` 及 `$emit` 通过自定义事件的监听与触发实现跨页面通讯

> 扩展原生 `Page` 实例的原理，可参考 [扩展原生 Page 对象](https://github.com/lijsh/omina/wiki/Omina-%E5%AE%9E%E7%8E%B0%E2%80%94%E2%80%94%E6%89%A9%E5%B1%95%E5%8E%9F%E7%94%9F-Page-%E5%AF%B9%E8%B1%A1)

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

- **set**

类似 `Vue.set`，`Omina` 为 `App` 实例增加了一个 `set` 方法，用来显式给 observe 后的对象添加新属性：
``` js
const app = getApp()
app.set(app.globalData, 'someKey', 'someVal')
```

- **del**

类似 `Vue.delete`

## TODO
- `Component` 的增强
-  支持 `Computed` 属性
- `request` 方法的增强

具体实现可参考这篇文章：https://juejin.im/post/5b55c1056fb9a04f951d1d4b

