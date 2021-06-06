## 1.浅拷贝
``` js
function simpleClone (target) {
    if (typeof target === 'object' && target !== null) {
        const cloneTarget = Array.isArray(target) ? [] : {};
        for (let prop in target) {
            if (target.hasOwnProperty(prop)) {
                cloneTarget[prop] = target[prop];
            }
        }
        return cloneTarget;
    } else {
        return target;
    }
}
```

思路：只要考虑是不是对象问题，如果不是对象直接返回，如果是对象一层一层遍历赋值即可

## 2.深拷贝
1）**不考虑循环引用等因素** 
``` js
function deepClone(target) {
    if (target === null) {
        return null;
    }
    if (typeof target !== 'object') {
        return target;
    }
    const cloneTarget = Array.isArray(target) ? [] : {};
    for (let prop in target) {
        if (target.hasOwnProperty) {
            cloneTarget[prop] = deepClone(target[prop]);
        }
    }
    return cloneTarget;
}
```
思路: 判断进来时的目标是否为对象，不是对象返回，否则进行递归操作，最后返回一个深拷贝完成的对象。

2） **考虑循环引用问题以及使用es5方式**
``` js
function isObject(target) {
    return (typeof target === 'object' || typeof target === 'function') && target !== null;
}
function find(list, target) {
    for (let i = 0; i < list.length; i++) {
        if (list[i].key === target) {
            return list[i];
        }
    }
    return null;
}
function deepClone (target, list) {
    if (!isObject(target)) {
        return target;
    }
    if (!list) {
        list = [];
    }
    var cloneTarget = Array.isArray(target) ? [] : {};
    const cloneData = find(list, target);
    if (cloneData) {
        return cloneData.key;
    }
    list.push({
        key: target,
        target: cloneTarget,
    })
    for (let prop in target) {
        if (target.hasOwnProperty(prop)) {
            cloneTarget[prop] = deepClone(target[prop], list)
        }
    }
    return cloneTarget;
}
```
思路：在前面深拷贝的基础上加上对一个对象数组存储已经读过的对象，如果是引用过的对象，直接返回使用该对象，如果不是则将该对象存储到数组中

3）**考虑循环引用并且对象为正则或者时间对象及使用es6Map**
``` js
function isObject(target) {
    return (typeof target === 'object' || typeof target === 'function') && target !== null;
}
function deepClone (target, map = new Map()) {
    if (map.get(target)) {
        return target;
    }
    const constructor = target.constructor;
    if (^(RegExp|Date)$/i.test(constructor.name)) {
        return new constructor(target);
    }
    if (isObject) {
        map.set(target, true);
        const cloneTarget = Array.isArray(target) ? [] : {};
        for (let prop in target) {
            if (target.hasOwnProperty(prop)) {
                cloneTarget[prop] = deepClone(target[prop], map);
            }
        }
    } else {
        return target;
    }
}
```
思路：利用map的特性去储存是否读取过该键值，如果读取过直接返回该键值，如果没有则将标记，使用正则表达式以及构造器的结合，判断是否为正则对象或者是时间对象。
