## New操作运算符

**new关键字进行了如下操作：**

- 创建一个空的对象obj
- 将obj的[[prototype]]属性指向构造函数constructor的原型，即obj.[[prototype]] = 属性指向构造函数constructor的原型prototype。
- 将构造函数constructor内部的this绑定到新建的对象obj上，执行constructor
- 若构造函数没有返回非原始值（即不是引用类型的），则返回该新建对象obj。否则返回引用类型


``` js
function myNew(constrc, ...args) {
    // 1. 创建一个空对象
	const obj = {};
	// 2. 将obj的[[prototype]]属性指向构造函数的原型对象
	obj.__proto__ = constrc.prototype;
	// 或者使用自带方法：Object.setPrototypeOf(obj, constrc.prototype)
	// 3.将constrc执行的上下文this绑定到obj上，并执行
	const result = constrc.call(obj, ...args);
	// 4.如果构造函数返回的是对象，则使用构造函数执行的结果。否则，返回新创建的对象
	return result instanceof Object ? result : obj;
}

// 使用的例子：
function Person(name, age){
	this.name = name;
	this.age = age;
}
const person1 = myNew(Person, 'Tom', 20)
console.log(person1)  // Person {name: "Tom", age: 20}
```

![image](https://img-blog.csdnimg.cn/20191119212535220.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9jaGVuLWNvbmcuYmxvZy5jc2RuLm5ldA==,size_16,color_FFFFFF,t_70#pic_center)