# Vue.set
## 1. 用法

::: tip
注意对象不能是 Vue 实例，或者 Vue 实例的根数据对象。
::: 

vm.$delete( target, propertyName/index )

- 参数：
    - {Object | Array} target
    - {string | number} propertyName/index

- 返回值：设置的值。

- 用法：
删除对象的属性。如果对象是响应式的，确保删除能触发更新视图。这个方法主要用于避开 Vue 不能检测到属性被删除的限制，但是你应该很少会使用它。

## 2. 内部原理

``` js 
del (target, key){
    if (Array.isArray(target) && isValidArrayIndex(key)) {
        target.length = Math.max(target.length, key)
        target.splice(key, 1)
        return
    }
    delete target[key]
    return
}
```
这只是最简单的思路，我们大概思路就是如此，接下来，我们来看一下vue源码是怎么做的

``` js
export function del (target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}
```
由上面代码我们可以看出其实delete的方式跟set的方式十分相似，只是将set的一部分代码改成去删除即可

``` js 
 if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
```
这一块只是去判断target是否存在的问题，我们是可以忽略这个的。

``` js
if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
}
```
判断如果传入的target是数组并且传入的key是有效索引的话，就使用数组的splice方法将索引key对应的值删掉。

接着我们继续往下看:

``` js 
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
if (!hasOwn(target, key)) {
    return
}
```
判断传入的key是否存在于target中，如果key本来就不存在于target中，那就不用删除，直接退出程序即可。

``` js
delete target[key]
if (!ob) {
    return
}
ob.dep.notify()
```
最后，如果target是对象，并且传入的key也存在于target中，那么就从target中将该属性删除，同时判断当前的target是否为响应式对象，如果是响应式对象，则通知依赖更新；如果不是，删除完后直接返回不通知更新。

## 参考链接
[Vue.delete原理](https://vue-js.com/learn-vue/instanceMethods/data.html#_3-vm-delete)  