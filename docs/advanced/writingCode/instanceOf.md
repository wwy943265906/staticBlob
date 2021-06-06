## instanceOf

### 原理：
instanceof 运算符用于检测构造函数的 prototype 属性是否出现在某个实例对象的原型链上。

### 思路：

步骤一：先取得当前类的原型，当前实例对象的原型链

步骤二：一直循环

- 取得当前实例对象原型链的原型链（proto = proto.____proto____，沿着原型链一直向上查找）
- 如果 当前实例的原型链  ____proto__ 上找到了当前类的原型prototype，则返回 true
- 如果 一直找到Object.prototype.____proto____ == null，Object的基类(null)上面都没找到，则返回 false

``` js
function _instanceOf (instanceObject, classFunc) {
    let classFunc = classFunc.prototype;
    // 如果没有__proto__属性可以使用getPrototypeOf代替
    // Object.getPrototypeOf(instanceObject)
    let proto = instanceObject.__proto__;
    while (true) {
        if (proto == null) {
            return false;
        }
        if (proto === classFunc) {
            return true;
        }
        proto = proto.__proto__;
    }
}
```