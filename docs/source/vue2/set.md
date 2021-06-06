# Vue.set
## 1. 用法

::: tip
注意对象不能是 Vue 实例，或者 Vue 实例的根数据对象。
::: 

Vue.set( target, propertyName/index, value )

- 参数：
    - {Object | Array} target
    - {string | number} propertyName/index
    - {any} value

- 返回值：设置的值。

- 用法：
向响应式对象中添加一个 property，并确保这个新 property 同样是响应式的，且触发视图更新。它必须用于向响应式对象上添加新 property，因为 Vue 无法探测普通的新增 property (比如 this.myObject.newProperty = 'hi')

## 2. 内部原理
通过上面的参数，跟用法，我们可以大概的猜测下，它的原理应该是怎么样的。

首先传一个对象或者是数组，然后我们将它交给相应的响应式原理的代码去做，这样可得如下

``` js 
set (target, key, val){
    if (Array.isArray(target) && isValidArrayIndex(key)) {
        target.length = Math.max(target.length, key)
        target.splice(key, 1, val)
        return val
    }
    defineReactive(ob.value, key, val)
    return val
}
```
这只是最简单的思路，我们大概思路就是如此，接下来，我们来看一下vue源码是怎么做的

``` js
export function set (target: Array<any> | Object, key: any, val: any): any {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  // 判断target是否是数组，key是否是合法的索引
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    // 通过splice对key位置的元素进行替换
    // splice在array.is进行了响应式的处理
    target.splice(key, 1, val)
    return val
  }
  // 如果key在对象中已经存在直接赋值
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  // 获取target中observer对象
  const ob = (target: any).__ob__
  // 如果target是vue实例或者$data直接返回
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  // 如果ob不存在，target不是响应式对象直接赋值
  if (!ob) {
    target[key] = val
    return val
  }
  // 把key设置为响应式属性
  defineReactive(ob.value, key, val)
  // 发送通知
  ob.dep.notify()
  return val
}
```

``` js 
 if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
```
这一块只是去判断target是否存在的问题，我们是可以忽略这个的。

那么接着来看下面的代码

``` js
if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
}
```
这一段代码，则是判断了target是否为数组，如果是数组，我们将先改变它的length属性，因为有可能是这样的一个例子:
``` js
let arr = [1, 2, 3];
arr[4] = 5;
```
类似于这种直接修改下标，并且改变了length属性的，就需要我们去手动修改length值。target.splice()这里看似调用了数组的splice方法，其实不然，这里其实是调用了我们的响应式数组处理中的方法，也就是说这里的splice修改之后的数据是可以被我们所观测到的。

接着我们继续往下看:

``` js 
if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
}
const ob = (target: any).__ob__
if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
        'Avoid adding reactive properties to a Vue instance or its root $data ' +
        'at runtime - declare it upfront in the data option.'
    )
    return val
}
```

那么如果传入的数据不是数组的话，就是对象，我们就先判断key是否存在于target中，如果存在直接修改。再去获取__ob__属性，这个属性我们说过，在对象转成响应式的时候，我们会给对象加上该属性，如果有这个属性便是响应式对象。我们看上面的注意点，对象不能是 Vue 实例，或者 Vue 实例的根数据对象。在这里target._isVue 和 ob.vmCount便是用来判断这个的。

接着往下看：
``` js
if (!ob) {
    target[key] = val
    return val
}
```
这里去判断是否为响应式数据，如果不是响应式，我们直接作为一个普通对象去赋值即可。

最后：
``` js
defineReactive(ob.value, key, val)
ob.dep.notify()
```
该对象是响应式对象，并且我们需要将新的值进行响应式处理，则去调用defineReactive去处理这个属性。最后通知依赖的更新

流程图如下：
<img :src="$withBase('/imgs/set.jpg')" alt="mixureSecure">

## 参考链接
[Vue.set原理](https://vue-js.com/learn-vue/instanceMethods/data.html#_2-vm-set)  