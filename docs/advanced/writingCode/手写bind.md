## 1.call

``` js
/**
 * context: 要改变的函数中的this指向，写谁就是谁
 * args：传递给函数的实参信息
 * this：要处理的函数 fn
 */
Function.prototype.maCall = function (context, ...args) {
    // 判断是否为null或者undefine,如果是则context为window
    context = context == null ? window : context;
    // 用变量判断该context类型是否为对象
    let contextType = typeof context;
    if (!/^(object|function)$/i.test(contextType)) {
        // context = new context.constructor(context); 
        // 不适用于 Symbol/BigInt
  	    context = Object(context);
	}
	let result;
	// 把函数作为对象的某个成员值
	context['fn'] = this;
    // 把函数执行，此时函数中的this就是
	result = context['fn'](...args);
	// 设置完成员属性后，删除
	delete context['fn'];
	return result;
}
```

## 2.apply
``` js
/**
 * context: 要改变的函数中的this指向，写谁就是谁
 * args：传递给函数的实参信息
 * this：要处理的函数 fn
 */
Function.prototype.apply = function(context, args) {

  context = context == null ? window : context;
  
  let contextType = typeof context;
  if (!/^(object|function)$/i.test(contextType)) {
  	context = Object(context);
	}
  
  let result;
  context['fn'] = this; 
  result = context['fn'](...args); 
	delete context['fn'];
  return result;
}
```

## 3.bind
``` js
/**
 * this: 要处理的函数 func
 * context: 要改变的函数中的this指向 obj
 * params：要处理的函数传递的实参 [10, 20]
 */
Function.prototype._bind = function(context, ...params) {
  
  let _this = this; // this: 要处理的函数
  return function anonymous (...args) {
    // args： 可能传递的事件对象等信息 [MouseEvent]
    // this：匿名函数中的this是由当初绑定的位置 触发决定的 （总之不是要处理的函数func）
    // 所以需要_bind函数 刚进来时，保存要处理的函数 _this = this
    _this.call(context, ...params.concat(args));
  }
}
```

**call、apply、bind的相同点**
- apply、call、bind三者都是用来改变函数this对象的指向。
- apply、call、bind三者的第一个参数都是this要指向的对象。
- apply 、 call 、bind 三者都可以利用后续参数传参。

**call、apply、bind的不同点**
- bind 是返回对应函数，便于稍后调用；apply 、call 则是立即调用 。
- call与apply只是接受参数不同，其他基本一致，call接受多个参数，而apply接收由后续参数组成的数组
- bind 除了返回是函数以外，它 的参数和 call 一样。