# 本地存储

## 1.Cookie
Cookie 最开始被设计出来其实并不是来做本地存储的，而是为了弥补HTTP在状态管理上的不足。

HTTP 协议是一个无状态协议，客户端向服务器发请求，服务器返回响应，就结束了。

这种背景下，就产生了 Cookie.

Cookie 本质上就是浏览器里面存储的一个很小的文本文件，内部以键值对的方式来存储(在chrome开发者面板的Application这一栏可以看到)。向同一个域名下发送请求，都会携带相同的 Cookie，服务器拿到 Cookie 进行解析，便能拿到客户端的状态。

Cookie 的作用很好理解，就是用来做状态存储的，但它也是有诸多致命的缺陷的：

- 容量缺陷。Cookie 的体积上限只有4KB，只能用来存储少量的信息。

- 性能缺陷。Cookie 紧跟域名，不管域名下面的某一个地址需不需要这个 Cookie ，请求都会携带上完整的 Cookie，这样随着请求数的增多，其实会造成巨大的性能浪费的，因为请求携带了很多不必要的内容。

- 安全缺陷。由于 Cookie 以纯文本的形式在浏览器和服务器中传递，很容易被非法用户截获，然后进行一系列的篡改，在 Cookie 的有效期内重新发送给服务器，这是相当危险的。另外，在HttpOnly为 false 的情况下，Cookie 信息能直接通过 JS 脚本来读取。

## 2.localStorage与sessionStorage
在HTML5中，新加入了一个webStorage特性，这个特性主要是用来作为本地存储来使用的，解决了cookie存储空间不足的问题(cookie中每条cookie的存储空间为4k)，webStorage中一般浏览器支持的是5M大小，这个在不同的浏览器中webStorage会有所不同。

#### webStorage特性：
1. 浏览器的大小不统一，并且在IE8以上的IE版本才支持webStorage这个属性

2. 目前所有的浏览器中都会把webStorage的值类型限定为string类型，这个在对我们日常比较常见的JSON对象类型需要一些转换

3. webStorage在浏览器的隐私模式下面是不可读取的

4. webStorage本质上是对字符串的读取，如果存储内容多的话会消耗内存空间，会导致页面变卡

5. webStorage不能被爬虫抓取到

#### 两者的区别
- localStorage与sessionStorage的唯一一点区别就是localStorage属于永久性存储，而sessionStorage属于当会话结束的时候，sessionStorage中的键值对会被清空。

#### 使用方式
通过webStorage暴露在全局，并通过它的 setItem 和 getItem等方法进行操作，非常方便。

## 参考链接
[能不能说一说浏览器的本地存储？](https://juejin.cn/post/6844904021308735502#heading-13)  