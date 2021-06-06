# 数据响应式

首先我们想要监听一个数据的变化，我们得知道数据什么时候给读取或者数据什么时候给修改了。那么就可以借助Object.defineProperty这个方法，我们就可以轻松的掌握数据的变化。

## 1. Object.defineProperty的使用

首先我们定义一个对象
``` js

let obj = {
  name: 'vim',
}

```

``` js
Object.defineProperty(obj, 'name', {
  enumerable: true,
  configurable: true,
  get(){
    console.log('name属性被读取了')
    return val
  },
  set(newVal){
    console.log('name属性被修改了')
    val = newVal
  }
})

var name = obj.name
// 输出name属性被读取了
obj.name = "yyds"
// 输出name属性被修改了
```
通过这段代码，我们可以知道，obj对象的name属性已经被我们所监控，但这样只能监听到一个属性，所以如果我们的obj中属性有多个，这样的代码就要copy多分吗？

这样子肯定是不行的。所以我们需要对代码进行处理.

所以代码可以改成以下这样
``` js
Object.keys(data).forEach(key => {
    Object.defineProperty(this, key, {
        enumerable: true,
        configurable: true,
        get () {
            return data[key];
        },
        set (newValue) {
            if (data[key] === newValue) {
                return;
            }
            data[key] = newValue;
        }
    })
})
```

然而这就是vue响应式数据的底层原理。

## 2.响应式的源码解析（对象）
``` js
export class Observer {
  // 观测对象
  value: any;
  // 依赖对象
  dep: Dep;
  // 实例计数器
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    // 初始化实例的vmCount为0
    this.vmCount = 0
    // 将实例挂载到观察对象的_ob_属性
    def(value, '__ob__', this)
    // 数组的响应式处理
    if (Array.isArray(value)) {
        ...
    } else {
      // 遍历对象中的每一个属性，转换成setter/getter
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk (obj: Object) {
    // 获取观察对象的每一个属性
    const keys = Object.keys(obj)
    // 遍历每一个属性，设置为响应式数据
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }
}


/**
 * 使一个对象转化成可观测对象
 * @param { Object } obj 对象
 * @param { String } key 对象的key
 * @param { Any } val 对象的某个key的值
 */

// 简易版本 不重要的属性在这里不详谈，有兴趣可自行查看源码
function defineReactive (obj,key,val) {
  // 创建依赖对象依赖
  const dep = new Dep()
  // 如果只传了obj和key，那么val = obj[key]
  if (arguments.length === 2) {
    val = obj[key]
  }
  if(typeof val === 'object'){
      new Observer(val)
  }
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get(){
      // 这是依赖收集所需要的
      dep.depend()
      console.log(`${key}属性被读取了`);
      return val;
    },
    set(newVal){
      if(val === newVal){
          return
      }
      console.log(`${key}属性被修改了`);
      val = newVal;
      // 派发更新（发布更改通知）
      dep.notify()
    }
  })
}

```

由上面代码我们可以知道，我们定义了一个observer类，它可以将正常对象转换为一个我们可以监听的对象，一个observer的实例。

并且我们给该对象添加了一个属性__ob__，该属性记录了一个observer的实例，同时也表明了该对象已经被转换成一个响应式对象，可以减少后续重复的操作。

然后就继续判断该对象的类型，上面的代码是处理对象的，不是数组的，所以如果该数据是对象，则调用walk方法，walk方法中调用了defineReactive 方法，将传入的对象的属性都加上getter和setter来监视数据的变化。这样就达成了我们的目的。

## 3.响应式的源码解析（数组 ）
为什么Object数据和Array型数据会有两种不同的变化侦测方式？

这是因为对于Object数据我们使用的是JS提供的对象原型上的方法Object.defineProperty，而这个方法是对象原型上的，所以Array无法使用这个方法，所以我们需要对Array型数据设计一套另外的变化侦测机制。

那我们先来看看数组是如何做到对数据的可观测的

### 使Array型数据可观测

简单版本:
``` js
const arrayProto = Array.prototype
// 创建一个对象作为拦截器
export const arrayMethods = Object.create(arrayProto)

// 改变数组自身内容的7个方法
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  const original = arrayProto[method]
  Object.defineProperty(arrayMethods, method, {
    enumerable: false,
    configurable: true,
    writable: true,
    value:function mutator(...args){
      const result = original.apply(this, args)
      return result
    }
  })
})
```

Vue源码如下：
``` js
const arrayProto = Array.prototype
// 使用数组的原型创建一个新的对象
export const arrayMethods = Object.create(arrayProto)
// 修改数组元素的方法
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  // 保存数组的原方法
  const original = arrayProto[method]
  // 调用Object.defineProperty重新定义数组的方法
  def(arrayMethods, method, function mutator (...args) {
    // 重新执行数组原始的方法
    const result = original.apply(this, args)
    // 获取数组对象的__ob__
    const ob = this.__ob__
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    // 对插入的新元素，重新遍历数组元素设置为响应式数据
    if (inserted) ob.observeArray(inserted)
    // notify change
    // 调用了修改数组的方法，调用数组的ob对象发送通知
    ob.dep.notify()
    return result
  })
})
```
现在就让我们来一步一步分析该过程。

为什么我们要对数组的方法进行重写呢？答案是因为数组的改变就是通过这些方法的，注意的是这些方法都是可以改变原数组的。

那我们就可以得到当数组用这些方法时，数组的值就可能会得到改变。

由上面的两段代码的思路，我们可以知道，首先创建了继承自Array原型的空对象arrayMethods，接着在arrayMethods上使用object.defineProperty方法将那些可以改变数组自身的7个方法遍历逐个进行封装。进行封装之后，我们调用的数组方法便是代理过后的方法，从而我们可以知道哪个时候调用了方法去改变数组，这样我们就可以把数据变成可观测的。那么在对象的时候，在数据改变时我们需要通知依赖发生改变，在数组这里也是一样的。当数据发生改变时，我们就要通知对应的依赖。

那么问题来了，其实这样我们觉得好像没啥问题了。

但是我们忽略了一个很重要的点，我们并没有将数组实例跟原型联系起来，这样是没有效果的。

我们需要在入口处判断是否该数据是数组的时候，将实例的__proto__属性指向我们刚修改的原型对象。也就是我们的arrayMethods这个变量。

``` js 

export class Observer {
  constructor (value) {
    this.value = value
    if (Array.isArray(value)) {
      const augment = protoAugment
      augment(value, arrayMethods, arrayKeys)
    } else {
      this.walk(value)
    }
  }
}

function protoAugment(target, src) {
  target.__proto__ = src
}
```
也就是上面这段代码，在源码中有更加详细的判断，可自行查看。

通过上面这段代码，我们就可以真真正正的获取到数组的改变了。


## 4. 依赖收集问题
上述中，我们一直提到一个名词就是依赖收集，那么依赖收集是什么呢，怎么做的依赖收集。

在上面的过程中，我们已经实现了数据的可观测，那么可观测的数据要来做什么呢？就是来做我们数据的依赖收集的。

简单的来说，依赖收集就是我们把"谁用到了这个数据"称为"谁依赖了这个数据",我们给每个数据都建一个依赖数组(因为一个数据可能被多处使用)，谁依赖了这个数据(即谁用到了这个数据)我们就把谁放入这个依赖数组中，那么当这个数据发生变化的时候，我们就去它对应的依赖数组中，把每个依赖都通知一遍，告诉他们："你们依赖的数据变啦，你们该更新啦！"。这个过程就是依赖收集。

那么思考一下，什么时候该收集依赖，而什么时候通知依赖。

没错，就是在我们的getter中收集依赖，在setter中通知依赖。原理也很简单，因为getter便是我们在哪里用到了数据，setter便是我们何时改变数据。

#### 依赖收集在哪里
最简单的来说，我们可以用一个变量来存储对应的依赖。但是，数据不一定就一处使用到，那么我们可以使用一个数组来将所有的依赖存储起来。并且每个数据都需要依赖。然后结合相应的功能，创建了Dep类。

``` js
export default class Dep {
  constructor () {
    this.subs = []
  }

  addSub (sub) {
    this.subs.push(sub)
  }
  // 删除一个依赖
  removeSub (sub) {
    remove(this.subs, sub)
  }
  // 添加一个依赖
  depend () {
    // 这里需注意，关键点
    if (window.target) {
      this.addSub(window.target)
    }
  }
  // 通知所有依赖更新
  notify () {
    const subs = this.subs.slice()
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}
```

有了这个dep类之后，我们便可以在我们getter的时候添加依赖，在我们setter的时候通知依赖。

``` js
function defineReactive (obj,key,val) {
  //实例化一个依赖管理器，生成一个依赖管理数组dep
  const dep = new Dep()
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get(){
      // 在getter中收集依赖
      dep.depend()
      return val;
    },
    set(newVal){
      val = newVal;
      // 在setter中通知依赖更新
      dep.notify()
    }
  })
}

```

## 5. 到底谁才是依赖
其实在Vue中还实现了一个叫做Watcher的类，而Watcher类的实例就是我们上面所说的那个"谁"。换句话说就是：谁用到了数据，谁就是依赖，我们就为谁创建一个Watcher实例。在之后数据变化时，我们不直接去通知依赖更新，而是通知依赖对应的Watch实例，由Watcher实例去通知真正的视图。

``` js
export default class Watcher {
  constructor (vm,expOrFn,cb) {
    this.vm = vm;
    this.cb = cb;
    this.getter = parsePath(expOrFn)
    this.value = this.get()
  }
  get () {
    window.target = this;
    const vm = this.vm
    let value = this.getter.call(vm, vm)
    window.target = undefined;
    return value
  }
  update () {
    const oldValue = this.value
    this.value = this.get()
    this.cb.call(this.vm, this.value, oldValue)
  }
}

/**
 * Parse simple path.
 * 把一个形如'data.a.b.c'的字符串路径所表示的值，从真实的data对象中取出来
 * 例如：
 * data = {a:{b:{c:2}}}
 * parsePath('a.b.c')(data)  // 2
 */
const bailRE = /[^\w.$]/
export function parsePath (path) {
  if (bailRE.test(path)) {
    return
  }
  const segments = path.split('.')
  return function (obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return
      obj = obj[segments[i]]
    }
    return obj
  }
}
```
这便是我们的依赖，谁用到了这个数据我们就去创建一个watcher实例。

那么，在创建Watcher实例的过程中它是如何的把自己添加到这个数据对应的依赖管理器中呢？

#### 添加过程
1. 当实例化Watcher类时，会先执行其构造函数。
2. 在构造函数中调用了this.get()实例方法。
3. 在get()方法中，首先通过window.target = this把实例自身赋给了全局的一个唯一对象window.target上，然后通过let value = this.getter.call(vm, vm)获取一下被依赖的数据，获取被依赖数据的目的是触发该数据上面的getter，上文我们说过，在getter里会调用dep.depend()收集依赖，而在dep.depend()中取到挂载window.target上的值并将其存入依赖数组中，在get()方法最后将window.target释放掉。举个例子：
``` js
new Watcher(hero, 'type', () => {
  return hero.health > 4000 ? '坦克' : '脆皮'
}, (val) => {
  console.log(`我的类型是：${val}`)
})
```
在Watcher类中的this.getter便是这里的匿名函数，如下
``` js 
() => {
  return hero.health > 4000 ? '坦克' : '脆皮'
}
```
那么当这个函数调用时，便会去获取hero.health这个属性，便会触发该属性的getter，然后我们收集依赖的时候是在getter中收集的，收集的时候我们给window.target赋值，存储着依赖，当前的依赖便是这个数据对应的watcher。那就是说当前的dep的append就是这个watcher。

4. 而当数据变化时，会触发数据的setter，在setter中调用了dep.notify()方法，在dep.notify()方法中，遍历所有依赖(即watcher实例)，执行依赖的update()方法，也就是Watcher类中的update()实例方法，在update()方法中调用数据变化的更新回调函数，从而更新视图。

## 6. 问题在哪里
通过上面的代码，我们可以知道，我们并没有对新增/删除的数据进行处理，也就是说，我们没办法对新增/删除的数据进行观测跟收集依赖等。同理的，在处理数组时也是没有将新增/删除数据考虑在其中的，那么vue是怎么去解决这个问题的？

这个我们可以后面一起看下全局的API，Vue.set和Vue.delete

## 总结
1. Data通过observer转换成了getter/setter的形式来追踪变化。
2. 当外界通过Watcher读取数据时，会触发getter从而将Watcher添加到依赖中。
3. 当数据发生了变化时，会触发setter，从而向Dep中的依赖（即Watcher）发送通知。
4. Watcher接收到通知后，会向外界发送通知，变化通知到外界后可能会触发视图更新，也有可能触发用户的某个回调函数等。

## 参考链接
[数据响应式原理](https://vue-js.com/learn-vue/reactive/object.htmls)  



