## 单例模式
### 1.定义
保证一个类仅有一个实例，并提供一个访问它的全局访问点

### 2.核心
确保只有一个实例，并提供全局访问

### 3.实现
假设要设置一个管理员，多次调用也仅设置一次，我们可以使用闭包缓存一个内部变量来实现这个单例

``` js
function SetManager (name) {
    this.manager = name;
}

SetManager.prototype.getName = function () {
    console.log(this.manager);
};

var SingletonSetManager = (function () {
    var manager = null;
    return function (name) {
        if (!manager) {
            manager = new SetManager(name);
        }
        return manager;
    }
})();

SingletonSetManager('a').getName(); // a
SingletonSetManager('b').getName(); // a
SingletonSetManager('c').getName(); // a
```
这是比较简单的做法，但是如果我们还需要设置另一个角色的话，就又要复制一遍代码了。所以，可以改写单利内部，实现更通用
``` js
function getSingleton (fn) {
    var instance = null;
    
    return function () {
        if (!instance) {
            instance = fn.apply(this, arguments);
        }
        return instance;
    }
}

// 则上面的代码需要改写成
var managerSingleton = getSingleton (function (name) {
    var manager = new SetManager(name);
    return manager;
})

managerSingleton('a').getName(); // a
managerSingleton('b').getName(); // a
managerSingleton('c').getName(); // a
```
这时我们如果需要添加另外的角色只要跟添加管理员类式即可
``` js
function SetHr (name) {
    this.hr = name;
}

SetHr.prototype.getName = function () {
    console.log(this.hr);
}

var hrSingleton = getSingleton(function (name) {
    var hr = new SetHr(name);
    return hr;
})

hrSingleton('aa').getName(); // aa
hrSingleton('bb').getName(); // aa
hrSingleton('cc').getName(); // aa
```
或者，仅想要创建一个div层，不需要将对象实例化，直接调用函数
``` js
function createPopup(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.append(div);

    return div;
}

var popupSingleton = getSingleton(function() {
    var div = createPopup.apply(this, arguments);
    return div;
});

console.log(
    popupSingleton('aaa').innerHTML,
    popupSingleton('bbb').innerHTML,
    popupSingleton('bbb').innerHTML
); // aaa  aaa  aaa
```