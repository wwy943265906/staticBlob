# diff过程详解

在我们了解diff之前，我们先来了解一下虚拟dom是什么

文章内的流程图网上下载，仅供自己学习以及做笔记。

## 1. 虚拟DOM
Virtual DOM 其实就是一棵以 JavaScript 对象( VNode 节点)作为基础的树，用对象属性来描述节点，实际上它只是一层对真实 DOM 的抽象。最终可以通过一系列操作使这棵树映射到真实环境上。

简单来说，可以把Virtual DOM 理解为一个简单的JS对象，并且最少包含标签名( tag)、属性(attrs)和子元素对象( children)三个属性。不同的框架对这三个属性的命名会有点差别。

而vue中的虚拟dom其实借鉴了snabbdom（有兴趣的可自行查看），在它的基础上进行改造。

类似于
``` js
<div class="a" id="b">我是内容</div>

{
  tag:'div',        // 元素标签
  attrs:{           // 属性
    class:'a',
    id:'b'
  },
  text:'我是内容',  // 文本内容
  children:[]       // 子元素
}
```

源码字段：
- tag: 当前节点的标签名
- data: 当前节点的数据对象
- children: 数组类型，包含了当前节点的子节点
- text: 当前节点的文本，一般文本节点或注释节点会有该属性
- elm: 当前虚拟节点对应的真实的dom节点
- ns: 节点的namespace
- context: 编译作用域
- functionalContext: 函数化组件的作用域
- key: 节点的key属性，用于作为节点的标识，有利于patch的优化
- componentOptions: 创建组件实例时会用到的选项信息
- child: 当前节点对应的组件实例
- parent: 组件的占位节点
- raw: raw html
- isStatic: 静态节点的标识
- isRootInsert: 是否作为根节点插入，被transition包裹的节点，该属性的值为false
- isComment: 当前节点是否是注释节点
- isCloned: 当前节点是否为克隆节点
- isOnce: 当前节点是否有v-once指令

我们可以看到，在源码中字段比之前多得多，那么问题来了，为什么要这么用这么复杂得数据结构去模拟一个虚拟dom呢。

## 2. 为什么要使用虚拟DOM
使用我们以前用jq或者原生js的开发方式，我们如果需要去在一个列表中去添加多个数据，那么浏览器会回流多次。因为每一次添加dom元素，都会触发回流，这样页面性能就会很低。

**那么虚拟dom带给我们的究竟是怎样的变化？**

以上面的例子来讲，首先我们在一个列表中去添加多条数据，首先虚拟dom不会立马去更新我们的dom结构，而是经过多次的diff，将内容更新到虚拟dom元素中，最终将最后的结构的虚拟dom一次性更新到我们的dom结构上。从而避免多次的操作dom元素，以此来提升性能。

## 3. Vue中的VNode
从上面我们知道了什么是虚拟dom，为什么要使用虚拟dom。现在我们来看看Vue中的虚拟dom究竟是什么样的。

### 3.1 VNode类
``` js
export default class VNode {
  constructor (
    tag?: string,
    data?: VNodeData,
    children?: ?Array<VNode>,
    text?: string,
    elm?: Node,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function
  ) {
    this.tag = tag                                /*当前节点的标签名*/
    this.data = data        /*当前节点对应的对象，包含了具体的一些数据信息，是一个VNodeData类型，可以参考VNodeData类型中的数据信息*/
    this.children = children  /*当前节点的子节点，是一个数组*/
    this.text = text     /*当前节点的文本*/
    this.elm = elm       /*当前虚拟节点对应的真实dom节点*/
    this.ns = undefined            /*当前节点的名字空间*/
    this.context = context          /*当前组件节点对应的Vue实例*/
    this.fnContext = undefined       /*函数式组件对应的Vue实例*/
    this.fnOptions = undefined
    this.fnScopeId = undefined
    this.key = data && data.key           /*节点的key属性，被当作节点的标志，用以优化*/
    this.componentOptions = componentOptions   /*组件的option选项*/
    this.componentInstance = undefined       /*当前节点对应的组件的实例*/
    this.parent = undefined           /*当前节点的父节点*/
    this.raw = false         /*简而言之就是是否为原生HTML或只是普通文本，innerHTML的时候为true，textContent的时候为false*/
    this.isStatic = false         /*静态节点标志*/
    this.isRootInsert = true      /*是否作为跟节点插入*/
    this.isComment = false             /*是否为注释节点*/
    this.isCloned = false           /*是否为克隆节点*/
    this.isOnce = false                /*是否有v-once指令*/
    this.asyncFactory = asyncFactory
    this.asyncMeta = undefined
    this.isAsyncPlaceholder = false
  }

  get child (): Component | void {
    return this.componentInstance
  }
}
```

从上面代码我们可以看到tag、data、children、key、text、elm，这些比较重要的，我们需要记住，其他可以先忽略，等到用到是可以再回来查看。


### 3.2 VNode的类型

#### 注释节点
首先，我们可以在源码的vnode.js中看到
``` js
// 创建注释节点
export const createEmptyVNode = (text: string = '') => {
  const node = new VNode()
  node.text = text
  node.isComment = true
  return node
}
```
这个节点是创建一个注释节点，isComment是代表该节点为注释节点，text则是注释的内容。

#### 文本节点
``` js
// 创建文本节点
export function createTextVNode (val: string | number) {
  return new VNode(undefined, undefined, undefined, String(val))
}
```
从这里看到创建了一个vnode 的节点，注意只传了第四个参数，对应上面的代码，我们可以知道，这个是text，也就是文本。

#### 克隆节点
``` js
// 创建克隆节点
export function cloneVNode (vnode: VNode): VNode {
  const cloned = new VNode(
    vnode.tag,
    vnode.data,
    // #7975
    // clone children array to avoid mutating original in case of cloning
    // a child.
    vnode.children && vnode.children.slice(),
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  )
  cloned.ns = vnode.ns
  cloned.isStatic = vnode.isStatic
  cloned.key = vnode.key
  cloned.isComment = vnode.isComment
  cloned.fnContext = vnode.fnContext
  cloned.fnOptions = vnode.fnOptions
  cloned.fnScopeId = vnode.fnScopeId
  cloned.asyncMeta = vnode.asyncMeta
  cloned.isCloned = true
  return cloned
}

```
克隆节点，顾名思义就是将所有旧节点的属性复制到新节点的属性，但是唯独不同的就是，克隆节点的isCloned这个属性是为true。代表了该节点是由克隆得到的。

#### 元素节点
元素节点我们比较容易理解，就是类似于我们的dom节点，只是结构比dom节点要简单得多
``` js
{
   children: [VNode,VNode],   //  子节点列表
   context: {},   //当前组件的实例
   data: {},      //节点上的数据，如attr、class、style
   tag: "p",      //标签名
 }
```

#### 组件节点
组件节点除了有元素节点具有的属性之外，它还有两个特有的属性：

- componentOptions :组件的option选项，如组件的props等
- componentInstance :当前组件节点对应的Vue实例

#### 函数式组件节点
函数式组件节点相较于组件节点，它又有两个特有的属性：

- fnContext:函数式组件对应的Vue实例
- fnOptions: 组件的option选项

介绍完了VNode，我们下面就可以开始来看看我们的Diff了。

## 4. patch
首先，我们了解diff之前，先了解一下patch。

patch意为补丁，vue中diff过程也叫patch过程。

那么，我们先来聊一下什么为patch。

玩游戏的小伙伴们都知道，每一个游戏都有节日活动或者各种活动。那么每个节日的活动又不一样，那么这时候，我们便需要在之前游戏的基础上去修改，不可能去重新开发整个游戏吧，这样不现实。

那么，问题就来了。

当节日活动过时时，游戏内部就得把该节日的活动下架或者删除掉。当从日常到节日时，游戏也要添加相应的活动。还有一种情况就是，当刚好从一个节日切换到另一个节日时，这个时候，游戏内部则需要将节日活动的内容进行更新。

那么，patch的过程也就很容易理解了。就是删除，创建以及更新三种。

- 创建新节点：新的VNode中有而旧的oldVNode中没有，就在旧的oldVNode中创建。
- 删除节点：新的VNode中没有而旧的oldVNode中有，就从旧的oldVNode中删除。
- 更新节点：新的VNode和旧的oldVNode中都有，就以新的VNode为准，更新旧的oldVNode。

源码如下：
``` js
// 注释仅供参考
function patch (oldVnode, vnode, hydrating, removeOnly) {
    // 当新的节点不存在，老节点存在时
    if (isUndef(vnode)) {
      // 销毁
      if (isDef(oldVnode)) invokeDestroyHook(oldVnode)
      return
    }

    let isInitialPatch = false
    const insertedVnodeQueue = []

    // 老的Vnode不存在
    if (isUndef(oldVnode)) {
      // empty mount (likely as component), create new root element
      isInitialPatch = true
      // 创建新的Vnode 不挂载
      createElm(vnode, insertedVnodeQueue)
    } else {
      // 新的Vnode跟老的Vnode都存在，更新
      const isRealElement = isDef(oldVnode.nodeType)
      // 判断参数1是否是真实的DOM
      if (!isRealElement && sameVnode(oldVnode, vnode)) {
        // patch existing root node
        // 更新操作，diff算法
        patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly)
      } else {
        // 第一个参数是真实的DOM，创建Vnode
        // 初始化
        if (isRealElement) {
          // mounting to a real element
          // check if this is server-rendered content and if we can perform
          // a successful hydration.
          if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
            oldVnode.removeAttribute(SSR_ATTR)
            hydrating = true
          }
          if (isTrue(hydrating)) {
            if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
              invokeInsertHook(vnode, insertedVnodeQueue, true)
              return oldVnode
            } else if (process.env.NODE_ENV !== 'production') {
              warn(
                'The client-side rendered virtual DOM tree is not matching ' +
                'server-rendered content. This is likely caused by incorrect ' +
                'HTML markup, for example nesting block-level elements inside ' +
                '<p>, or missing <tbody>. Bailing hydration and performing ' +
                'full client-side render.'
              )
            }
          }
          // either not server-rendered, or hydration failed.
          // create an empty node and replace it
          oldVnode = emptyNodeAt(oldVnode)
        }

        // replacing existing element
        const oldElm = oldVnode.elm
        const parentElm = nodeOps.parentNode(oldElm)

        // create new node
        createElm(
          vnode,
          insertedVnodeQueue,
          // extremely rare edge case: do not insert if old element is in a
          // leaving transition. Only happens when combining transition +
          // keep-alive + HOCs. (#4590)
          oldElm._leaveCb ? null : parentElm,
          nodeOps.nextSibling(oldElm)
        )

        // update parent placeholder node element, recursively
        if (isDef(vnode.parent)) {
          let ancestor = vnode.parent
          const patchable = isPatchable(vnode)
          while (ancestor) {
            for (let i = 0; i < cbs.destroy.length; ++i) {
              cbs.destroy[i](ancestor)
            }
            ancestor.elm = vnode.elm
            if (patchable) {
              for (let i = 0; i < cbs.create.length; ++i) {
                cbs.create[i](emptyNode, ancestor)
              }
              // #6513
              // invoke insert hooks that may have been merged by create hooks.
              // e.g. for directives that uses the "inserted" hook.
              const insert = ancestor.data.hook.insert
              if (insert.merged) {
                // start at index 1 to avoid re-invoking component mounted hook
                for (let i = 1; i < insert.fns.length; i++) {
                  insert.fns[i]()
                }
              }
            } else {
              registerRef(ancestor)
            }
            ancestor = ancestor.parent
          }
        }

        // destroy old node
        if (isDef(parentElm)) {
          removeVnodes([oldVnode], 0, 0)
        } else if (isDef(oldVnode.tag)) {
          invokeDestroyHook(oldVnode)
        }
      }
    }

    invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)
    return vnode.elm
  }
```
其实，我们可以不用全部弄懂其中的意思，将代码折叠起来之后，代码呈现的大结构才是我们所需要探讨的。

折叠之后如下图：
<img :src="$withBase('/imgs/diff.png')" alt="mixureSecure">

我们可以很清晰的看到，其实就是我们上面所说的三种情况：
- 新节点不存在，老节点存在时，直接销毁
- 新节点存在，老节点不存在，直接新建
- 新节点跟老节点都存在时，去更新处理
    - 旧节点不是DOM(组件节点)，且新旧节点相同 - 执行patchVnode
    - 旧节点是DOM元素或者两个节点不相同 - 创建新节点DOM，销毁旧节点以及DOM。

#### 销毁节点
``` js
if (isDef(oldVnode)) invokeDestroyHook(oldVnode)
```
我们可以看到上面这一句，其实销毁节点就是去调用旧节点destroy生命周期函数

#### 创建节点
其实patch的过程已经是将vnode节点转成真实的dom，并且将dom插入到我们的页面中了，所以在vnode节点中的一些类型并不能够创建。

能够创建的类型只有三种，分别为注释，文本，以及元素节点。

源码折叠如下图：

::: tip
源码位置：src\core\vdom\patch.js\createElm函数
::: 

<img :src="$withBase('/imgs/diff2.png')" alt="mixureSecure">

- 判断是否为元素节点只需判断该VNode节点是否有tag标签即可。如果有tag属性即认为是元素节点，则调用createElement方法创建元素节点，通常元素节点还会有子节点，那就递归遍历创建所有子节点，将所有子节点创建好之后insert插入到当前元素节点里面，最后把当前元素节点插入到DOM中。
- 判断是否为注释节点，判断完成插入到DOM中。
- 如果不是元素节点，不是注释节点，那么就是文本节点，创建文本节点，插入到DOM中。

流程图如下：

<img :src="$withBase('/imgs/diff3.png')" alt="mixureSecure">

#### 更新节点
首先先来看一下源码

::: tip
源码位置：src\core\vdom\patch.js\patchVnode函数
::: 

<img :src="$withBase('/imgs/diff4.png')" alt="mixureSecure">

我们这里可以看到清晰的判断流程。

其实一开始是先判断是否为vnode是否完全相同。
``` js
if (oldVnode === vnode) {
    return
}
```

接下来，我们一步一步分析代码。

- 第一步，判断是否为静态节点
    - 如果是静态节点，直接返回。
- 第二步，判断是否为文本节点，如果为文本节点的话，判断是否是text相同，如果不同，直接将旧节点的内容替换为新节点的文本。
- 第三步，如果vnode中没有text属性，则该节点为元素节点。
    - 如果节点中有子节点
        - 如果新的节点内包含了子节点，那么此时要看旧的节点是否包含子节点，如果旧的节点里也包含了子节点，那就需要递归对比更新子节点；如果旧的节点里不包含子节点，那么这个旧节点有可能是空节点或者是文本节点，如果旧的节点是空节点就把新的节点里的子节点创建一份然后插入到旧的节点里面，如果旧的节点是文本节点，则把文本清空，然后把新的节点里的子节点创建一份然后插入到旧的节点里面。
    - 该节点不包含子节点
        - 如果该节点不包含子节点，同时它又不是文本节点，那就说明该节点是个空节点，那就好办了，不管旧节点之前里面都有啥，直接清空即可。

流程图如下：

<img :src="$withBase('/imgs/diff5.png')" alt="mixureSecure">

我们可以第三步中看到，如果新旧节点都有子节点的话，那么调用一个updateChildren的函数。

可以说，updateChildren这个函数，就是diff算法的核心。接下来我们一起来看看。

## 5. updateChildren
::: tip
源码位置：src\core\vdom\patch.js\updateChildren函数
::: 

首先，我们先来看一下updateChildren函数。源码折叠图如下：

<img :src="$withBase('/imgs/diff6.png')" alt="mixureSecure">

看到代码中的变量，我们先来分析一下有什么用？

首先，oldStartIdx，newStartIdx，oldEndIdx，newEndIdx，这4个变量代表的是新旧VNode的索引值。

oldStartVnode、newStartVnode、oldEndVnode和new EndVnode分别指向这几个索引对应的vnode。

那为什么需要这些变量呢？

因为这些变量是来优化我们的diff算法的。如果按照正常的，我们需要使用两个循环去遍历，然后找到相同的VNode，然后去patchVnode，这样的话计算量就会大很多。那么vue便使用了一种算法，先去判断这些Vnode是否为相同的，不符合这些条件之后，再去使用循环，这样就能提升计算的效率。

接下来，我们看一下，vue中是怎么优化的。

这是两个新旧VNode的例子图：
<img :src="$withBase('/imgs/diff7.png')" alt="mixureSecure">

首先我们先来看下这两个判断：
``` js
if (isUndef(oldStartVnode)) {
    oldStartVnode = oldCh[++oldStartIdx] // Vnode has been moved left
} else if (isUndef(oldEndVnode)) {
    oldEndVnode = oldCh[--oldEndIdx]
}
```
我们可以得出结论：
- 当oldStartVnode不存在的时候，oldStartVnode向右移动，oldStartIdx加1
- 当oldEndVnode不存在的时候，oldEndVnode向左移动，oldEndIdx减1

接着，我们看以下的4个判断：
``` js
else if (sameVnode(oldStartVnode, newStartVnode)) {
    // oldStartVnode和newStartVnode相同
    // 直接将该节点进行patchVnode
    patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx)
    // 获取下一组开始节点
    oldStartVnode = oldCh[++oldStartIdx]
    newStartVnode = newCh[++newStartIdx]
} else if (sameVnode(oldEndVnode, newEndVnode)) {
    // oldStartVnode和newStartVnode相同
    patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx)
    // 获取下一组结束节点
    oldEndVnode = oldCh[--oldEndIdx]
    newEndVnode = newCh[--newEndIdx]
} else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
    // oldStartVnode和newEndVnode相同
    // 进行patchVnode，把oldStartVnode移动最后
    patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx)
    canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm))
    oldStartVnode = oldCh[++oldStartIdx]
    newEndVnode = newCh[--newEndIdx]
} else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
    // oldEndVnode和newStartVnode相同
    // 进行patchVnode，把oldEndVnode移动到最前面
    patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx)
    canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm)
    oldEndVnode = oldCh[--oldEndIdx]
    newStartVnode = newCh[++newStartIdx]
}
```

1. 第一种情况，判断旧前节点是否与新前节点是相同，如果相同则直接去patchVnode，然后将oldStartIdx++，newStartIdx++。如果不是相同节点，那么接着往下判断。如下图：

<img :src="$withBase('/imgs/diff8.png')" alt="mixureSecure">

2. 第二种情况，判断旧后节点是否与新后节点是相同，如果相同则直接去patchVnode，然后将oldEndIdx--，newEndIdx--。如果不是相同节点，那么接着往下判断。如下图：

<img :src="$withBase('/imgs/diff9.png')" alt="mixureSecure">

3. 第三种情况，判断新后节点是否与旧前节点是相同，如果相同则直接去patchVnode，然后将旧前节点移至旧后位置后面，将oldStartIdx++，newEndIdx--。如果不是相同节点，那么接着往下判断。如下图：

<img :src="$withBase('/imgs/diff10.png')" alt="mixureSecure">

---

<img :src="$withBase('/imgs/diff11.png')" alt="mixureSecure">

3. 第四种情况，判断旧后节点是否与新前节点是相同，如果相同则直接去patchVnode，然后将旧后节点移至旧前位置前面，将newStartIdx++，oldEndIdx--。如果不是相同节点，那么接着往下判断。如下图：

<img :src="$withBase('/imgs/diff12.png')" alt="mixureSecure">

---

<img :src="$withBase('/imgs/diff13.png')" alt="mixureSecure">

最后，我们来看下如果四种情况都不符合是如何处理的，源码如下：
``` js
else {
    // 以上四种情况都不满足
    // newStartNode依次和旧节点比较

    // 从新的节点开头获取一个，去老的节点中查找相同节点
    // 先找新的开始节点的key和老节点相同的索引，如果没有找到在通过sameVnode找
    if (isUndef(oldKeyToIdx)) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
    idxInOld = isDef(newStartVnode.key) ? oldKeyToIdx[newStartVnode.key] : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx)
    // 如果没有找到
    if (isUndef(idxInOld)) { // New element
        // 创建节点并插入到最前面
        createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx)
    } else {
        // 获取要移动的节点
        vnodeToMove = oldCh[idxInOld]
        // 如果使用sameVnode找到相同的老节点
        if (sameVnode(vnodeToMove, newStartVnode)) {
        // 进行patchVnode，并且将找到的旧节点移动到最前面
            patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue, newCh, newStartIdx)
            oldCh[idxInOld] = undefined
            canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm)
        } else {
            // key相同，但是是不同的元素，创建新的元素
            // same key but different element. treat as new element
            createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx)
        }
    }
    newStartVnode = newCh[++newStartIdx]
}
```
我们可以看到，这个处理其实相对于上面来说的话会比较复杂一点。

首先去判断是否能在旧的未处理的节点中，找到跟新前节点相同的节点。
- 如果在旧的未处理的所有节点中，没有找到与新前节点相同的key值的节点
    - 创建新节点DOM并添加到旧起始节点DOM的前面
- 如果在旧的未处理的节点中，找到了与新前节点相同key值的节点，这里分两种情况。
    - 旧节点中存在与新起始节点相同的节点，直接去patchVnode，将相同的旧节点DOM添加到旧起始节点DOM前面，将oldCh[idxInOld] = undefined。
    - 如果是另一种情况，则是key值相同，而tag值不同。也就是不符合sameVnode的条件时，创建新节点DOM并添加到旧起始节点DOM的前面。
最后newStartIdx++。

当我们跳出了循环，也是存在两种情况的。
``` js
// 当结束时 oldStartIdx > oldEndIdx，旧节点遍历完，但新节点还没有
if (oldStartIdx > oldEndIdx) {
    // 说明新节点比老节点多，把剩下的新节点插入到老节点的后面
    refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm
    addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue)
} else if (newStartIdx > newEndIdx) {
    // 当结束时 newStartIdx > newEndIdx ，新节点遍历完，但是旧节点没有
    removeVnodes(oldCh, oldStartIdx, oldEndIdx)
}
```
- 当结束时 oldStartIdx > oldEndIdx，旧节点遍历完，但新节点还没有，说明了新的子节点数组比旧的子节点数组长，那么我们需要将newStartIdx, newEndIdx之间的所有节点都插入到dom中。
- 当结束时 newStartIdx > newEndIdx ，新节点遍历完，但是旧节点没有，那需要将oldStartIdx, oldEndIdx之间的节点删除掉。

自此diff算法的过程就已经完成了。



## 补充
那么从源码这里，我们其实可以知道一个很重要的点，就是为什么平时我们开发的时候不能用index作为key值来用。

首先我们先看下，vue中是如何判断两个节点是相同节点的。

::: tip
源码位置：src\core\vdom\patch.js\sameVnode函数
::: 

``` js
function sameVnode (a, b) {
  return (
    a.key === b.key && (
      (
        a.tag === b.tag &&
        a.isComment === b.isComment &&
        isDef(a.data) === isDef(b.data) &&
        sameInputType(a, b)
      ) || (
        isTrue(a.isAsyncPlaceholder) &&
        a.asyncFactory === b.asyncFactory &&
        isUndef(b.asyncFactory.error)
      )
    )
  )
}
```
首先，我们一开始看到的就是，a.key === b.key，也就是说，我们判断相同节点时，key值是一定相同的。

所以，如果我们是用index作为key的值的话，会导致什么后果呢？

看下以下代码：
``` js
<div v-for="(item, index) in list" :key="index" >{{item.name}}</div>

list: [
    {
        name: 'Person1',
        id: 1
    },
    {
        name: 'Person2',
        id: 2
    },
    {
        name: 'Person3',
        id: 3
    },
    {
        name: 'Person4',
        id: 4
    },
]
```
以此为例子，我删除了id为2的对象过后，就会出现问题了。

删除前：
<img :src="$withBase('/imgs/diff14.png')" alt="mixureSecure">

删除后：
<img :src="$withBase('/imgs/diff15.png')" alt="mixureSecure">

可以看到，原本按我们的想法的话，删除了对象2过后，我们的key应该是0,2,3的，那么这样就导致了一个问题，新的节点跟旧的节点的匹配，是id1 -> id1，id3 -> id2，id4 -> id3的。

这样的话，那么就根本没有起到提升性能的作用，反而会增加计算量。去更新两个节点中的东西。

还有，我们也不能使用random作为key值，因为就算两个元素没有改变，重新渲染时，random值的改变，会使得两个一模一样的节点去重新计算。

## 参考链接
[Vue.diff原理](https://vue-js.com/learn-vue/virtualDOM/#_1-%E5%89%8D%E8%A8%80)

[vue中使用v-for时为什么不能用index作为key？](https://segmentfault.com/a/1190000019961419)
