## 代理模式
### 1.定义
为一个对象提供一个代用品或占位符，以便控制对它的访问
### 2.核心
当客户不方便直接访问一个对象或者不满足需要的时候，提供提个替身来控制对这个对象的访问，客户实际上访问的是替身对象<br>
替身对象对请求做出一些处理之后，再把请求转交给本体对象<br>
代理和本地的接口具有一致性，本体定义了关键功能，而代理是提供或拒绝对它的访问，或者在访问本体之前做一些额外的事情。
### 3.实现
代理模式主要有三种：保护代理，虚拟代理，缓存代理<br>
保护代理主要实现了访问主体的限制行为，以过滤字符作为简单的例子
``` js
// 主体，发送消息
function sendMsg (msg) {
    console.log(msg);    
}

//代理，对消息进行过滤
function proxySendMsg (msg) {
    // 无消息则返回
    if (typeof msg === 'undefined') {
        console.log('deny');
        return;
    }
    msg = ('' + msg).replace(/泥\s*煤/g, '');
    
    sendMsg(msg);
} 

sendMsg('泥煤呀泥 煤呀'); // 泥煤呀泥 煤呀
proxySendMsg('泥煤呀泥 煤'); // 呀
proxySendMsg(); // deny
```
它的意图很明显，在访问本体之前进行控制，没有消息的时候在代理中返回了，拒绝访问主体，这数据保护代理的形式<br>
有消息的时候对敏感字符进行了处理，这属于虚拟代理的模式

虚拟代理在控制对主体访问时，加入了一些额外的操作<br>
在滚动事件触发的时候，也许不需要频繁触发，我们可以引入函数节流，这是一种虚拟代理的实现
``` js
// 函数防抖，频繁操作中不处理，直到操作完成之后才一次性处理
function debounce (fn, delay) {
    delay = delay || 200;
    var timer = null;
    
    return function () {
        var arg = arguments;
        
        //每次操作时，清除上一次的定时器
        clearTimeout(timer);
        timer = null;
        
        // 定义新的定时器，一段时间之后操作
        timer = setTimeout(function () {
            fn.apply(this, arg);
        }, delay);
    }
};

var count = 0;

function scorllHandle (e) {
    console.log(e.type, ++count);
}

var proxtScorllHandle = (function () {
    return debounce(scorllHandle, 500);
})();

window.onscorll = proxyScorllHandle;
```
缓存代理可以为一些开销大的运算结果提供暂时的缓存，提升效率，例如：
``` js
// 主体
function add () {
    var arg = [].slice.call(arguments);
    return arg.reduce(function(a, b) {
        return a + b;
    });
}

// 代理
var proxyAdd = (function () {
    var cache = [];
    
    return function () {
        var arg = [].slice.call(arguments).join(',');
        
        // 如果有，则直接从缓存返回
        if (cache[arg]) {
            return cache[arg];
        } else {
            var ret = add.apply(this, arguments);
            return ret;
        }
    }
})();

console.log(
    add(1, 2, 3, 4),
    add(1, 2, 3, 4),

    proxyAdd(10, 20, 30, 40),
    proxyAdd(10, 20, 30, 40)
); // 10 10 100 100
```