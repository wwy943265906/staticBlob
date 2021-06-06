## Object.create
**使用方法：Object.create方法创建一个新对象，使用现有的对象来提供新创建的对象的__proto__。**

1. Object.create()方法创建一个新的对象，并以方法的第一个参数作为新对象的__proto__属性的值（以第一个参数作为新对象的构造函数的原型对象）

2. Object.create()方法还有第二个可选参数，是一个对象，对象的每个属性都会作为新对象的自身属性，对象的属性值以descriptor（Object.getOwnPropertyDescriptor(obj, 'key')）的形式出现，且enumerable默认为false


因为第二个参数比较少用
``` js
function myObjCreate (prototype) {
    if (prototype === null || typeof prototype !== 'object') {
        return false;
    }
    function Temp () {};
    Temp.prototype = prototype;
    const obj = new Temp();
    return obj;
}
```

完整版
``` js
Object.myCreate = function (proto, propertyObject = undefined) {
  if (propertyObject === null) {
    // 这里没有判断propertyObject是否是原始包装对象
    throw 'TypeError'
  } else {
    function Fn () {}
    Fn.prototype = proto
    const obj = new Fn()
    if (propertyObject !== undefined) {
      Object.defineProperties(obj, propertyObject)
    }
    if (proto === null) {
      // 创建一个没有原型对象的对象，Object.create(null)
      obj.__proto__ = null
    }
    return obj
  }
}
```