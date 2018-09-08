## wxa-utils
> 小程序的一些增强方法，主要是 `Page` 的增强。

具体实现可参考这篇文章：https://juejin.im/post/5b55c1056fb9a04f951d1d4b

## 使用方法
``` js
import Page from 'wx-utils'

Page({
  onLoad(options) {}
})
```

## 页面实例属性
- **$prevPage**

  获取上一个页的页面对象
## 页面实例方法
- **$navigateTo({ url, params })**

  跳转到 `url` 指定页面，同时传递 `params` 参数，此参数可在下一页的 `onLoad` 中取回：
  ``` js
  // A 跳转 B
  this.$navigateTo({ url: 'urlToB', params: { foo: 'bar' } })

  // B 页面的 onLoad
  Page({
    onLoad(options) {
      console.log(options.params) // { foo: 'bar' }
    }
  })
  ```


