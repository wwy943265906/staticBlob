# 手写promise

:::tip
在手写promise之前，我们需要知道什么是promiseA+规范
:::

Promise表示一个异步操作的最终结果。与Promise最主要的交互方法是通过将函数传入它的then方法从而获取得Promise最终的值或Promise最终最拒绝（reject）的原因。

而promiseA+规范则是限制promise书写的一种规范

## 1. PromiseA+规范

### 1. 术语
<font color=red>promise</font> 是一个包含了兼容promise规范then方法的对象或函数  
<font color=red>thenable</font> 是一个包含了then方法的对象或函数  
<font color=red>value</font> 是任何Javascript值。 (包括 undefined, thenable, promise等)  
<font color=red>exception</font> 是由throw表达式抛出来的值  
<font color=red>reason</font> 是一个用于描述Promise被拒绝原因的值  

### 2. 要求
### 2.1 Promise状态
:::tip
一个Promise必须处在其中之一的状态中: pending, fulfilled 或 rejected
:::

- 如果是pending状态，则promise:
    - 可以转换到fulfilled或rejected状态。
- 如果是fulfilled状态,则promise:
    - 不能转换成任何其它状态。
    - 必须有一个值，且这个值不能被改变。
- 如果是rejected状态,则promise:
    - 不能转换成任何其它状态。
    - 必须有一个原因，且这个值不能被改变。

### 2.2 then方法
:::tip
一个Promise必须提供一个then方法来获取其值或原因。
Promise的then方法接受两个参数：
:::
```
promise.then(onFulfilled, onRejected)
```
- onFulfilled 和 onRejected 都是可选参数：
    - 如果onFulfilled不是一个函数，则忽略之。
    - 如果onRejected不是一个函数，则忽略之。

- 如果onFulfilled是一个函数:
    - 它必须在promise fulfilled后调用， 且promise的value为其第一个参数。
    - 它不能在promise fulfilled前调用。
    - 不能被多次调用。

- 如果onRejected是一个函数,
    - 它必须在promise rejected后调用， 且promise的reason为其第一个参数。
    - 它不能在promise rejected前调用。
    - 不能被多次调用。

- 在执行上下文栈中只包含平台代码之前，onFulfilled或onRejected一定不能被调用 [3.1]

- onFulfilled和onRejected一定被作为函数调用(没有this值) [3.2]

- 对于一个promise，它的then方法可以调用多次.
    - 当promise fulfilled后，所有onFulfilled都必须按照其注册顺序执行。
    - 当promise rejected后，所有OnRejected都必须按照其注册顺序执行。

- then 必须返回一个promise [3.3].     **(promise2 = promise1.then(onFulfilled,onRejected))**
    - 如果onFulfilled 或 onRejected 返回了值x, 则执行Promise 解析流程[[Resolve]](promise2, x).
    - 如果onFulfilled 或 onRejected抛出了异常e, 则promise2应当以e为reason被拒绝。
    - 如果 onFulfilled 不是一个函数且promise1已经fulfilled，则promise2必须以promise1的值fulfilled.
    - 如果 OnReject 不是一个函数且promise1已经rejected, 则promise2必须以相同的reason被拒绝.

### 2.3 Promise解析过程

:::tip
**Promise解析过程** 是以一个promise和一个值做为参数的抽象过程，可表示为[[Resolve]](promise, x). 过程如下；
:::

- 如果promise 和 x 指向相同的值, 使用 TypeError做为原因将promise拒绝。
- 如果 x 是一个promise, 采用其状态 [3.4]:
    - 如果x是pending状态，promise必须保持pending走到x fulfilled或rejected.
    - 如果x是fulfilled状态，将x的值用于fulfill promise.
    - 如果x是rejected状态, 将x的原因用于reject promise.
- 如果x是一个对象或一个函数：
    - 将 then 赋为 x.then. [3.5]
    - 如果在取x.then值时抛出了异常，则以这个异常做为原因将promise拒绝。
    - 如果 then 是一个函数， 以x为this调用then函数， 且第一个参数是resolvePromise，第二个参数是rejectPromise，且：
        - 当 resolvePromise 被以 y为参数调用, 执行 [[Resolve]](promise, y).
        - 当 rejectPromise 被以 r 为参数调用, 则以r为原因将promise拒绝。
        - 如果 resolvePromise 和 rejectPromise 都被调用了，或者被调用了多次，则只第一次有效，后面的忽略。
        - 如果在调用then时抛出了异常，则：
            - 如果 resolvePromise 或 rejectPromise 已经被调用了，则忽略它。
            - 否则, 以e为reason将 promise 拒绝。
    - 如果 then不是一个函数，则 以x为值fulfill promise。
- 如果 x 不是对象也不是函数，则以x为值 fulfill promise。

### 3. 注解
- 3.1. 这里“平台代码”意味着引擎、环境以及promise的实现代码。在实践中，这需要确保onFulfilled和onRejected异步地执行，并且应该在then方法被调用的那一轮事件循环之后用新的执行栈执行。这可以用如setTimeout或setImmediate这样的“宏任务”机制实现，或者用如MutationObserver或process.nextTick这样的“微任务”机制实现。由于promise的实现被考虑为“平台代码”，因此在自身处理程序被调用时可能已经包含一个任务调度队列。
- 3.2. 严格模式下，它们中的this将会是undefined；在非严格模式，this将会是全局对象。
- 3.3. 假如实现满足所有需求，可以允许promise2 === promise1。每一个实现都应该记录是否能够产生promise2 === promise1以及什么情况下会出现promise2 === promise1
- 3.4. 通常，只有x来自于当前实现，才知道它是一个真正的promise。这条规则允许那些特例实现采用符合已知要求的Promise的状态。
- 3.5. 这个程序首先存储x.then的引用，之后测试那个引用，然后再调用那个引用，这样避免了多次访问x.then属性。此类预防措施对于确保访问者属性的一致性非常重要，因为访问者属性的值可能在俩次检索之间发生变化。

## 2. 手写源码
``` js
/**
 * 1. new Promise时，需要传递一个 executor 执行器，执行器立刻执行
 * 2. executor 接受两个参数，分别是 resolve 和 reject
 * 3. promise 只能从 pending 到 rejected, 或者从 pending 到 fulfilled
 * 4. promise 的状态一旦确认，就不会再改变
 * 5. promise 都有 then 方法，then 接收两个参数，分别是 promise 成功的回调 onFulfilled, 
 *      和 promise 失败的回调 onRejected
 * 6. 如果调用 then 时，promise已经成功，则执行 onFulfilled，并将promise的值作为参数传递进去。
 *      如果promise已经失败，那么执行 onRejected, 并将 promise 失败的原因作为参数传递进去。
 *      如果promise的状态是pending，需要将onFulfilled和onRejected函数存放起来，等待状态确定后，
 *      再依次将对应的函数执行(发布订阅)
 * 7. then 的参数 onFulfilled 和 onRejected 可以缺省
 * 8. promise 可以then多次，promise 的then 方法返回一个 promise
 * 9. 如果 then 返回的是一个结果，那么就会把这个结果作为参数，传递给下一个then的成功的回调(onFulfilled)
 * 10. 如果 then 中抛出了异常，那么就会把这个异常作为参数，传递给下一个then的失败的回调(onRejected)
 * 11.如果 then 返回的是一个promise,那么需要等这个promise，那么会等这个promise执行完，promise如果成功，
 *   就走下一个then的成功，如果失败，就走下一个then的失败
 */

const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';
function Promise(executor) {
    let self = this;
    self.status = PENDING;
    self.onFulfilled = [];//成功的回调
    self.onRejected = []; //失败的回调
    //PromiseA+ 2.1
    function resolve(value) {
        if (self.status === PENDING) {
            self.status = FULFILLED;
            self.value = value;
            self.onFulfilled.forEach(fn => fn());//PromiseA+ 2.2.6.1
        }
    }

    function reject(reason) {
        if (self.status === PENDING) {
            self.status = REJECTED;
            self.reason = reason;
            self.onRejected.forEach(fn => fn());//PromiseA+ 2.2.6.2
        }
    }

    try {
        executor(resolve, reject);
    } catch (e) {
        reject(e);
    }
}

Promise.prototype.then = function (onFulfilled, onRejected) {
    //PromiseA+ 2.2.1 / PromiseA+ 2.2.5 / PromiseA+ 2.2.7.3 / PromiseA+ 2.2.7.4
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason };
    let self = this;
    //PromiseA+ 2.2.7
    let promise2 = new Promise((resolve, reject) => {
        if (self.status === FULFILLED) {
            //PromiseA+ 2.2.2
            //PromiseA+ 2.2.4 --- setTimeout
            // 模拟异步
            setTimeout(() => {
                try {
                    //PromiseA+ 2.2.7.1
                    let x = onFulfilled(self.value);
                    resolvePromise(promise2, x, resolve, reject);
                } catch (e) {
                    //PromiseA+ 2.2.7.2
                    reject(e);
                }
            });
        } else if (self.status === REJECTED) {
            //PromiseA+ 2.2.3
            setTimeout(() => {
                try {
                    let x = onRejected(self.reason);
                    resolvePromise(promise2, x, resolve, reject);
                } catch (e) {
                    reject(e);
                }
            });
        } else if (self.status === PENDING) {
            self.onFulfilled.push(() => {
                setTimeout(() => {
                    try {
                        let x = onFulfilled(self.value);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            self.onRejected.push(() => {
                setTimeout(() => {
                    try {
                        let x = onRejected(self.reason);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        }
    });
    return promise2;
}

function resolvePromise(promise2, x, resolve, reject) {
    let self = this;
    //PromiseA+ 2.3.1
    if (promise2 === x) {
        reject(new TypeError('Chaining cycle'));
    }
    if (x && typeof x === 'object' || typeof x === 'function') {
        let used; //PromiseA+2.3.3.3.3 只能调用一次
        try {
            let then = x.then;
            if (typeof then === 'function') {
                //PromiseA+2.3.3
                then.call(x, (y) => {
                    //PromiseA+2.3.3.1
                    if (used) return;
                    used = true;
                    resolvePromise(promise2, y, resolve, reject);
                }, (r) => {
                    //PromiseA+2.3.3.2
                    if (used) return;
                    used = true;
                    reject(r);
                });

            }else{
                //PromiseA+2.3.3.4
                if (used) return;
                used = true;
                resolve(x);
            }
        } catch (e) {
            //PromiseA+ 2.3.3.2
            if (used) return;
            used = true;
            reject(e);
        }
    } else {
        //PromiseA+ 2.3.3.4
        resolve(x);
    }
}

module.exports = Promise;
```

### 2.1 Promise.resolve

:::tip
Promise.resolve(value) 返回一个以给定值解析后的Promise 对象.
:::

- 如果 value 是个 thenable 对象，返回的promise会“跟随”这个thenable的对象，采用它的最终状态
- 如果传入的value本身就是promise对象，那么Promise.resolve将不做任何修改、原封不动地返回这个promise对象。
- 其他情况，直接返回以该值为成功状态的promise对象。

``` js
Promise.resolve = function (param) {
    if (param instanceof Promise) {
        return param;
    }
    return new Promise((resolve, reject) => {
        if (param && param.then && typeof param.then === 'function') {
            setTimeout(() => {
                param.then(resolve, reject);
            });
        } else {
            resolve(param);
        }
    });
}
```

### 2.2 Promise.reject
:::tip
Promise.reject方法和Promise.resolve不同，Promise.reject()方法的参数，会原封不动地作为reject的理由，变成后续方法的参数。
:::

``` js
Promise.reject = function (reason) {
    return new Promise((resolve, reject) => {
        reject(reason);
    });
}
```

### 2.3 Promise.prototype.catch
:::tip
Promise.prototype.catch 用于指定出错时的回调，是特殊的then方法，catch之后，可以继续 .then 
:::
``` js
Promise.prototype.catch = function (onRejected) {
    return this.then(null, onRejected);
}
```

### 2.4 Promise.prototype.finally
:::tip
不管成功还是失败，都会走到finally中,并且finally之后，还可以继续then。并且会将值原封不动的传递给后面的then.
:::
``` js
Promise.prototype.finally = function (callback) {
    return this.then((value) => {
        return Promise.resolve(callback()).then(() => {
            return value;
        });
    }, (err) => {
        return Promise.resolve(callback()).then(() => {
            throw err;
        });
    });
}
```

### 2.5 Promise.all
:::tip
Promise.all(promises) 返回一个promise对象
:::
- 如果传入的参数是空的可迭代对象，那么此promise对象回调答应(resolve)，只有此情况，是同步执行的，其他都是异步返回
- 如果传入的参数不包含任何 promise，则返回一个异步完成.
- promises 中所有的promise都promise都“完成”时或参数中不包含 promise 时回调完成。
- 如果参数中有一个promise失败，那么Promise.all返回的promise对象失败
- 在任何情况下，Promise.all 返回的 promise 的完成状态的结果都是一个数组

``` js
Promise.all = function (promises) {
    return new Promise((resolve, reject) => {
        let index = 0;
        let result = [];
        if (promises.length === 0) {
            resolve(result);
        } else {
            function processValue(i, data) {
                result[i] = data;
                if (++index === promises.length) {
                    resolve(result);
                }
            }
            for (let i = 0; i < promises.length; i++) {
                //promises[i] 可能是普通值
                Promise.resolve(promises[i]).then((data) => {
                    processValue(i, data);
                }, (err) => {
                    reject(err);
                    return;
                });
            }
        }
    });
}
```

### 2.6 Promise.race
:::tip
Promise.race函数返回一个 Promise，它将与第一个传递的 promise 相同的完成方式被完成。它可以是完成（ resolves），也可以是失败（rejects），这要取决于第一个完成的方式是两个中的哪个。

如果传的参数数组是空，则返回的 promise 将永远等待。

如果迭代包含一个或多个非承诺值和/或已解决/拒绝的承诺，则 Promise.race 将解析为迭代中找到的第一个值。
:::

``` js
Promise.race = function (promises) {
    return new Promise((resolve, reject) => {
        if (promises.length === 0) {
            return;
        } else {
            for (let i = 0; i < promises.length; i++) {
                Promise.resolve(promises[i]).then((data) => {
                    resolve(data);
                    return;
                }, (err) => {
                    reject(err);
                    return;
                });
            }
        }
    });
}
```

## 3. Promise优缺点
### 3.1 缺点：
- 无法取消promise，一旦新建它就会立即执行，无法中途取消
- 如果不设置回调函数，promise内部抛出的错误，不会被反应到外部
- 当处于pedding状态时，无法得知目前的进展（刚刚开始还是即将要结束）
- promise封装ajax时，由于promise是异步任务，发送请求的三步会被延后到整个脚本同步代码执行完，并且将响应回调函数延迟到现有队列的最后，如果大量使用会大大降低了请求效率。

### 3.2 优点：
- 解决回调地狱问题
- 更好的进行错误捕获

## 参考链接
[Promise的源码实现（完美符合Promise/A+规范）](https://segmentfault.com/a/1190000018428848?utm_source=tag-newest)  
[(译)Promise/A+ 规范](https://zhuanlan.zhihu.com/p/143204897)  
[Promise/A+规范](https://segmentfault.com/a/1190000002452115#) 