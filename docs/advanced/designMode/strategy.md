## 策略模式
### 1.定义
定义一系列的算法，把它们一个个封装起来，并且使它们可以相互替换。
### 2.核心
将算法的使用和算法的实现分离开来。<br>
一个基于策略模式的程序至少由两部分组成:<br>
第一个部分是一组策略类，策略类封装了具体的算法，并负责具体的计算过程。<br>
第二个部分是环境类Context，Context接收客户的请求，随后把请求委托给某一个策略类。要做到这点，说明Context中要维持对某个对象的引用。
### 3.实现
策略模式可以用于组合一系列算法，也可以用于组合一系列业务规则<br>
假设需要通过成绩来计算学生的最终得分，每个成绩等级有对应得加权值。我们可以利用对象字面量的形式直接定义这个策略组。
``` js
// 映射关系
var levelMap = {
    S: 10,
    A: 8,
    B: 6,
    C: 4
};

// 组策略
var scoreLevel = {
    basicScore: 80,
    
    S: function () {
        return this.basicScore + levelMap['S'];
    },
    
    A: function () {
        return this.basicScore + levelMap['A'];
    },
    
    B: function () {
        return this.basicScore + levelMap['B'];
    },
    
    C: function () {
        return this.basicScore + levelMap['C'];
    }
}

// 调用
function getScore (level) {
    return scoreLevel[level] ? scoreLevel[level]() : 0;
}

console.log(
    getScore('S'),
    getScore('A'),
    getScore('B'),
    getScore('C'),
    getScore('D')
); // 90 88 86 84 0
```
在组合业务规则方面，比较经典的就是表单的验证方法。
``` js
// 错误提示
var errorMsgs = {
    default: '输入数据格式不正确',
    minLength: '输入数据长度不足',
    isNumber: '请输入数字',
    required: '内容不为空'
};

// 规则集
var rules = {
    minLength: function (value, length, errorMsg) {
        if (value.length < length) {
            return errorMsg || errorMsgs['minLength'];
        }
    },
    
    isNumber: function (value, errorMsg) {
        if (!/\d+/.test(value)) {
            return errorMsg || errorMsgs['isNumber'];
        }
    },
    
    required: function (value, errorMsg) {
        if (value === '') {
            return errorMsg || errorMsgs['required'];
        }
    }
}

function Validator () {
    this.items = [];
}

Validator.prototype = {
    constructor: Validator,
    
    // 添加校验规则
    add: function (value, rule, errorMsg) {
        var arg = [value];
        
        if (rule.indexOf('minLength') !== -1) {
            var temp = rule.split(':');
            arg.push(temp[1]);
            rule = temp[0];
        }
    
        arg.push(errorMsg);
        
        this.items.push(function () {
            return rules[rule].apply(this, arg);
        })
    },
    
    // 开始校验
    start: function () {
        for (var i = 0; i < this.items.length; i++) {
            var ret = this.items[i]();
            if (ret) {
                console.log(ret);
            }
        }
    }
};

// 测试数据
function testTel (val) {
    return val;
}

var validate = new Validator();

validate.add(testTel('ccc'), 'isNumber', '只能为数字'); // 只能为数字
validate.add(testTel(''), 'required'); // 内容不为空
validate.add(testTel('123'), 'minLength:5', '最少5位'); // 最少5位
validate.add(testTel('12345'), 'minLength:5', '最少5位');

var ret = validate.start();

console.log(ret);
```
### 4.优缺点
优点：可以有效地避免多重条件语句，将一系列方法封装起来也更直观，利于维护。<br>
缺点：往往策略集会比较多，我们需要事先就了解定义好所有的情况。