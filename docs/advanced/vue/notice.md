## Vue 的父组件和子组件生命周期钩子函数执行顺序？
Vue的父组件和子组件生命周期钩子执行顺序可以归类为以下4类：

- 加载渲染过程：父beforeCreate -> 父created -> 父beforeMount -> 子beforeCreate -> 子Created -> 子beforeMount ->子Mounted -> 父mounted
- 子组件更新过程：父beforeUpdate -> 子beforeUpdate -> 子updated -> 父updated
- 父组件更新过程：父beforeUpdate -> 父updated
- 销毁过程：父befordDestroy -> 子beforeDestroy -> 子destroyed -> 父destroyed

## 父组件监听子组件生命周期
可以在父组件引用子组件时通过 @hook 来监听即可，如下所示：
``` js
// 父组件
<Child @hook:mounted="doSomething"/>

doSomething () {
     console.log('父组件监听到 mounted 钩子函数 ...');
}


// 子组件
mounted(){
   console.log('子组件触发 mounted 钩子函数 ...');
},

// 以上输出顺序为：
// 子组件触发 mounted 钩子函数 ...
// 父组件监听到 mounted 钩子函数 ...  
```
@hook方法也可以监听其他的生命周期事件。

## 为什么组件中的 data 必须是一个函数，然后 return 一个对象，而 new Vue 实例里，data 可以直接是一个对象

因为组件是用来复用的，且JS里对象是引用关系，如果组件中的data是一个对象，那么这样作用域没有隔离，子组件中的data属性值会互相影响，如果组件中的data是一个函数，那么每个实例可以维护一份被返回对象的独立拷贝，组件间的data属性不会互相影响。而new Vue的实例是不会被复用的，因此不存在引用对象的问题

## v-model的原理
我们在vue项目中主要使用v-model指令在表单input、select等元素上创建双向绑定，我们知道v-model不过是语法糖，v-model在内部为不同的输入元素使用不同的属性并抛出不同的事件：

- text 和 textarea 元素使用 value 属性和 input 事件；
- checkbox 和 radio 使用 checked 属性和 change 事件；
- select 字段将 value 作为 prop 并将 change 作为事件。

以input元素为例

``` js
<input v-model='something'>

相当于

<input v-bind:value="something" v-on:input="something = $event.target.value">

```
如果是在自定义组件中，v-model默认会利用名为value的prop和名为input的事件，如下：
``` js
父组件：

<ModelChild v-model="message"></ModelChild>

子组件：
<div>{{value}}</div>

props: {
    value: string
}

methods: {
  test1(){
     this.$emit('input', '小红')
  },
},
```

## Vue 组件间通信有哪几种方式
vue组件通信主要是指以下3中：父子组件通信、隔代组件通信、兄弟组件通信

#### 1. props / $emit 适用 父子组件通信 这种方法是 Vue 组件的基础
``` js
// 子组件代码
<template>
  <div class="child">
    <h4>this is child component</h4>
    <input type="text" v-model="message" @keyup="send" />
    <p>收到来自父组件的消息：{{ messageFromParent }}</p>
  </div>
</template>
<script>
export default {
  name: 'Child',
  props: ['messageFromParent'],  // 通过props接收父组件传过来的消息
  data() {
    return {
      message: '',
    }
  },
  methods: {
    send() {
      // 通过$emit触发on-receive事件，调用父组件中receive回调，并将this.message作为参数
      this.$emit('on-receive', this.message)  
    },
  },
}
</script>
```

``` js
<template>
  <div class="parent">
    <h3>this is parent component</h3>
    <input type="text" v-model="message" />
    <p>收到来自子组件的消息：{{ messageFromChild }}</p>
    <Child :messageFromParent="message" @on-receive="receive" />
  </div>
</template>
<script>
import Child from './child'
export default {
  name: 'Parent',
  data() {
    return {
      message: '', // 传递给子组件的消息
      messageFromChild: '',
    }
  },
  components: {
    Child,
  },
  methods: {
    receive(msg) { // 接受子组件的信息，并将其赋值给messageFromChild
      this.messageFromChild = msg
    },
  },
}
</script>
```


#### 2. ref与$praent / $children 适用父子通信

- ref：如果在普通的DOM元素上使用，引用就是指向DOM元素，如果用在子组件上，引用就指向子组件
- $parent / $ children：访问父/子组件 

``` js
// 子组件
<template>
  <div class="child">
    <h4>this is child component</h4>
    <input type="text" v-model="message" />
    <p>收到来自父组件的消息：{{ $parent.message }}</p>  <!--展示父组件实例的message-->
  </div>
</template>
<script>
export default {
  name: 'Child1',
  data() {
    return {
      message: '',   // 父组件通过this.$children可以获取子组件实例的message
    }
  },
}
</script>
```

``` js
// 父组件
<template>
  <div class="parent">
    <h3>this is parent component</h3>
    <input type="text" v-model="message" />
    <p>收到来自子组件的消息：{{ child1.message }}</p> <!--展示子组件实例的message-->
    <Child />
  </div>
</template>
<script>
import Child from './child'
export default {
  name: 'Parent',
  data() {
    return {
      message: '',
      child1: {},
    }
  },
  components: {
    Child,
  },
  mounted() {
    this.child1 = this.$children.find((child) => {
      return child.$options.name === 'Child1'  // 通过options.name获取对应name的child实例
    })
  },
}
</script>
```


#### 3. EventBus （$emit / $on） 适用于 父子、隔代、兄弟组件通信 这种方法通过一个空的 Vue 实例作为中央事件总线（事件中心），用它来触发事件和监听事件，从而实现任何组件间的通信，包括父子、隔代、兄弟组件。

#### 4. $attrs / $listeners 适用于隔代组件通信

- $attrs：包含了父作用域不被prop识别的特性绑定（class和style除外）。当一个组件没有声明任何prop时，这里会包含所有父作用域的绑定，并且可以通过v-bind="$attrs"传入内部组件。通常配合inheritAttrs 选项一起使用,试想一下，当你创建了一个组件，你要接收 param1 、param2、param3 …… 等数十个参数，如果通过 props，那你需要通过props: ['param1', 'param2', 'param3', ……]等声明一大堆。如果这些 props 还有一些需要往更深层次的子组件传递，那将会更加麻烦。
而使用 $attrs ，你不需要任何声明，直接通过$attrs.param1、$attrs.param2……就可以使用，而且向深层子组件传递上面也给了示例，十分方便。
- $listeners：包含了父作用域中的v-on事件监听器。它可以通过v-on="$listeners"传入内部组件。


示例：
在这个实例中，共有三个组件：A、B、C，其关系为：[ A [ B [C] ] ]，A为B的父组件，B为C的父组件。即：1级组件A，2级组件B，3级组件C。我们实现了：

- 父向子传值：1级组件A通过:messageFromA="message"将 message 属性传递给2级组件B，2级组件B通过$attrs.messageFromA获取到1级组件A的 message 。
- 跨级向下传值：1级组件A通过:messageFromA="message"将 message 属性传递给2级组件B，2级组件B再通过 v-bind="$attrs"将其传递给3级组件C，3级组件C通过$attrs.messageFromA获取到1级组件A的 message 。
- 子向父传值：1级组件A通过@keyup="receive"在子孙组件上绑定keyup事件的监听，2级组件B在通过v-on="$listeners"来将 keyup 事件绑定在其 input 标签上。当2级组件B input 输入框输入时，便会触发1级组件A的receive回调，将2级组件B的 input 输入框中的值赋值给1级组件A的 messageFromComp ，从而实现子向父传值。
- 跨级向上传值：1级组件A通过@keyup="receive"在子孙组件上绑定keyup事件的监听，2级组件B在通过 <CompC v-on="$listeners" />将其继续传递给C。3级组件C在通过v-on="$listeners"来将 keyup 事件绑定在其 input 标签上。当3级组件C input 输入框输入时，便会触发1级组件A的receive回调，将3级组件C的 input 输入框中的值赋值给1级组件A的 messageFromComp ，从而实现跨级向上传值。

``` js
// 3级组件C
<template>
  <div class="compc">
    <h5>this is C component</h5>
    <input name="compC" type="text" v-model="message" v-on="$listeners" /> <!--将A组件keyup的监听回调绑在该input上-->
    <p>收到来自A组件的消息：{{ $attrs.messageFromA }}</p>
  </div>
</template>
<script>
export default {
  name: 'Compc',
  data() {
    return {
      message: '',
    }
  },
}
</script>
```

``` js
// 2级组件B
<template>
  <div class="compb">
    <h4>this is B component</h4>
    <input name="compB" type="text" v-model="message" v-on="$listeners" />  <!--将A组件keyup的监听回调绑在该input上-->
    <p>收到来自A组件的消息：{{ $attrs.messageFromA }}</p>
    <CompC v-bind="$attrs" v-on="$listeners" /> <!--将A组件keyup的监听回调继续传递给C组件，将A组件传递的attrs继续传递给C组件-->
  </div>
</template>
<script>
import CompC from './compC'
export default {
  name: 'CompB',
  components: {
    CompC,
  },
  data() {
    return {
      message: '',
    }
  },
}
</script>
```

``` js
// A组件
<template>
  <div class="compa">
    <h3>this is A component</h3>
    <input type="text" v-model="message" />
    <p>收到来自{{ comp }}的消息：{{ messageFromComp }}</p>
    <CompB :messageFromA="message" @keyup="receive" />  <!--监听子孙组件的keyup事件，将message传递给子孙组件-->
  </div>
</template>
<script>
import CompB from './compB'
export default {
  name: 'CompA',
  data() {
    return {
      message: '',
      messageFromComp: '',
      comp: '',
    }
  },
  components: {
    CompB,
  },
  methods: {
    receive(e) { // 监听子孙组件keyup事件的回调，并将keyup所在input输入框的值赋值给messageFromComp
      this.comp = e.target.name
      this.messageFromComp = e.target.value
    },
  },
}
</script>
```

#### 5. provide / inject

provide / inject 适用于隔代组件通信。祖先组件中通过provider来提供变量，然后在子孙组件中通过inject来注入变量。provide / inject API 主要解决了跨级组件间的通信问题，不过它的使用场景，主要是子组件获取上级组件的状态，跨级组件间建立了一种主动提供与依赖注入的关系。

provide：是一个对象，或者返回是一个对象的函数。该对象包含可注入其子孙的property，即要传递给子孙的属性和属性值。
inject：一个字符串数组，或者是一个对象。当其为字符串数组时，使用方式和props十分相似，只不过接收了属性由data变成了provide中的属性。当其为对象时，也和props类似，可以通过配置default和from等属性来设置默认值，在子组件中使用新的命名属性等。

##### 代码示例
这个实例中有三个组件，1级组件A，2级组件B，3级组件C：[ A [ B [C] ] ]，A是B的父组件，B是C的父组件。实例中实现了：

- 父向子传值：1级组件A通过provide将message注入给子孙组件，2级组件B通过inject: ['messageFromA']来接收1级组件A中的message，并通过messageFromA.content获取1级组件A中message的content属性值。
- 跨级向下传值：1级组件A通过provide将message注入给子孙组件，3级组件C通过inject: ['messageFromA']来接收1级组件A中的message，并通过messageFromA.content获取1级组件A中message的content属性值，实现跨级向下传值。

``` js
// 1级组件A
<template>
  <div class="compa">
    <h3>this is A component</h3>
    <input type="text" v-model="message.content" />
    <CompB />
  </div>
</template>
<script>
import CompB from './compB'
export default {
  name: 'CompA',
  provide() {
    return {
      messageFromA: this.message,  // 将message通过provide传递给子孙组件
    }
  },
  data() {
    return {
      message: {
        content: '',
      },
    }
  },
  components: {
    CompB,
  },
}
</script>
```

``` js
// 2级组件B
<template>
  <div class="compb">
    <h4>this is B component</h4>
    <p>收到来自A组件的消息：{{ messageFromA && messageFromA.content }}</p>
    <CompC />
  </div>
</template>
<script>
import CompC from './compC'
export default {
  name: 'CompB',
  inject: ['messageFromA'], // 通过inject接受A中provide传递过来的message
  components: {
    CompC,
  },
}
</script>
```

``` js
// 3级组件C
<template>
  <div class="compc">
    <h5>this is C component</h5>
    <p>收到来自A组件的消息：{{ messageFromA && messageFromA.content }}</p>
  </div>
</template>
<script>
export default {
  name: 'Compc',
  inject: ['messageFromA'], // 通过inject接受A中provide传递过来的message
}
</script>
```

##### 注意点：
1） 1级组件A中的message为什么要用object类型而不是string类型，因为在vue provide 和 inject 绑定并不是可响应的。如果message是string类型，在1级组件A中通过input输入框改变message值后无法再赋值给messageFromA，如果是object类型，当对象属性值改变后，messageFromA里面的属性值还是可以随之改变的，子孙组件inject接收到的对象属性值也可以相应变化。

2） 子孙provide和祖先同样的属性，会在后代中覆盖祖先的provide值。例如2级组件B中也通过provide向3级组件C中注入一个messageFromA的值，则3级组件C中的messageFromA会优先接收2级组件B注入的值而不是1级组件A。

#### 6. vuex
Vuex 适用于 父子、隔代、兄弟组件通信 Vuex 是一个专为 Vue.js 应用程序开发的状态管理模式。每一个 Vuex 应用的核心就是 store（仓库）。“store” 基本上就是一个容器，它包含着你的应用中大部分的状态 ( state )。

#### 7. v-slot
v-solt是vue2.6版本新增的统一实现插槽和具名插槽的API。

v-solt在template便签中用于提供具名插槽或需要接收prop的插槽，如果不能指定v-solt，则取默认值default


实例：

``` js
/*
    父向子传值：父组件通过<template v-slot:child>{{ message }}</template>将父组件的message值传递给子组件，子组件通过<slot name="child"></slot>接收到相应内容，实现了父向子传值。
*/
// 子组件代码
<template>
  <div class="child">
    <h4>this is child component</h4>
    <p>收到来自父组件的消息：
      <slot name="child"></slot>  <!--展示父组件通过插槽传递的{{message}}-->
    </p>
  </div>
</template>

```

``` js
<template>
  <div class="parent">
    <h3>this is parent component</h3>
    <input type="text" v-model="message" />
    <Child>
      <template v-slot:child>
        {{ message }}  <!--插槽要展示的内容-->
      </template>
    </Child>
  </div>
</template>
<script>
import Child from './child'
export default {
  name: 'Parent',
  data() {
    return {
      message: '',
    }
  },
  components: {
    Child,
  },
}
</script>
```


## Vue 怎么用 vm.$set() 解决对象新增属性不能响应的问题
收js的限制，vue无法检测到对象属性的添加或删除。由于vue会在初始化时对属性执行getter、setter转化，所以属性必须在data对象上存在才能让vue将它转换为响应式的。但是 Vue 提供了 Vue.set (object, propertyName, value) / vm.$set (object, propertyName, value) 来实现为对象添加响应式属性

``` js
export function set (target: Array<any> | Object, key: any, val: any): any {
  // target 为数组  
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    // 修改数组的长度, 避免索引>数组长度导致splcie()执行有误
    target.length = Math.max(target.length, key)
    // 利用数组的splice变异方法触发响应式  
    target.splice(key, 1, val)
    return val
  }
  // key 已经存在，直接修改属性值  
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  const ob = (target: any).__ob__
  // target 本身就不是响应式数据, 直接赋值
  if (!ob) {
    target[key] = val
    return val
  }
  // 对属性进行响应式处理
  defineReactive(ob.value, key, val)
  ob.dep.notify()
  return val
}
```

我们阅读以上源码可知，vm.$set 的实现原理是：
- 如果目标是数组，直接使用数组的splice方法触发响应式
- 如果目标是对象，会先判断属性是否存在、对象是否是响应式，最终如果要对属性进行响应式处理，则是通过调用 defineReactive 方法进行响应式处理（ defineReactive 方法就是 Vue 在初始化对象时，给对象属性采用 Object.defineProperty 动态添加 getter 和 setter 的功能所调用的方法）

## Vue 中的 key 有什么作用？
key是vue中vnode的唯一标识，通过这个key，我们的diff操作可以更加准确、更快速。vue的diff过程可以概括为oldCh 和 newCh 各有两个头尾的变量 oldStartIndex、oldEndIndex 和 newStartIndex、newEndIndex，即一共4种比较方式：newStartIndex 和oldStartIndex 、newEndIndex 和 oldEndIndex 、newStartIndex 和 oldEndIndex 、newEndIndex 和 oldStartIndex，如果以上4种比较都没匹配，如果设置了key，就会用key再进行比较，在比较的过程中，遍历会往中间靠，一旦 StartIdx > EndIdx 表明 oldCh 和 newCh 至少有一个已经遍历完了，就会结束比较。


**所以vue中的key的作用是：key是为vue中vnode的唯一标识，通过这个key，我们的操作更加准确，更快速**

- 更准确：因为带 key 就不是就地复用了，在 sameNode 函数 a.key === b.key 对比中可以避免就地复用的情况。所以会更加准确。
- 更快速：利用 key 的唯一性生成 map 对象来获取对应节点，比遍历方式更快。


## computed和watch的区别
计算属性：
- 支持缓存，只有依赖数据发生改变，才会重新进行计算
- 不支持异步，当computed内有异步操作时无效，无法监听数据的变化
- computed属性会默认走缓存，计算属性是基于它们的响应式依赖进行缓存的，也就是基于data中声明过或者父组件传递的props中的数据通过计算得到的值
- 如果一个属性是由其他属性计算而来的，这个属性依赖其他属性，是一个多对一或者一对一，一般用computed
- 如果computed属性值是函数，那么默认会走get方法；函数的返回值就是属性的属性值；在computed中，属性都有一个get和set方法，当数据发生变化时就用set方法。

侦听属性watch：
- 不支持缓存，数据变，直接会触发相应的操作。
- watch支持异步
- 监听的函数传入两个参数，第一个参数是最新的值，第二个参数是输入之前的值
- 当一个属性发生变化时，需要执行对应的操作，一对多
- 监听数据必须是data中声明或者父组件传递过来的props中的数据，当数据变化时，触发其他操作，函数有两个参数

immediate：组件加载立即触发回调函数执行
``` js
watch: {
  firstName: {
    handler(newName, oldName) {
      this.fullName = newName + ' ' + this.lastName;
    },
    // 代表在wacth里声明了firstName这个方法之后立即执行handler方法
    immediate: true
  }
}

```
deep：deep的意思就是深入观察，监听器会一层层的网下遍历，给对象所有的属性都加上这个监听器，但是这样性能开销很大，任何修改obj里面一个属性都会触发这个监听器的handle
``` js
watch: {
  obj: {
    handler(newName, oldName) {
      console.log('obj.a changed');
    },
    immediate: true,
    // 深度监听
    deep: true
  }
}
```

优化：使用字符串的形式监听
``` js
watch: {
  'obj.a': {
    handler(newName, oldName) {
      console.log('obj.a changed');
    },
    immediate: true,
    // deep: true
  }
}
```

## Vue.js的template编译
简单步骤：转化成AST树，再得到的render函数返回VNode（Vue的虚拟DOM节点）

首先，通过compile编译器把template编译成AST语法树，compile是createCompiler的返回值，createCompiler是用以创建编译器的。另外compile还负责合并option。然后，AST会经过generate得到render函数，render的返回值是vnode，vnode是vue的虚拟节点，里面有（标签名、子节点、文本等等）

## v-on监听多个事件
``` js
<input type="text" v-on="{ input:onInput,focus:onFocus,blur:onBlur, }">
```

## 路由器参数解耦
``` js
const router = new Router({
    routes:[{
        path: '/:id',
        component: Component,
        props: true
    }]
})
```
用这种方式可以在props中获取params
``` js
export default {
  props: ['id'],
  methods: {
    getParamsId() {
      return this.id
    }
  }
}
```
还可以传入函数自定义props
``` js
const router = new VueRouter({
  routes: [{
    path: '/:id',
    component: Component,
    props: router => ({ id: route.query.id })
  }]
})
```