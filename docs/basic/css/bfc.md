# BFC
## 1. BFC的定义
BFC(Block formatting context)直译为"块级格式化上下文"。它是一个独立的渲染区域，只有Block-level box参与， 它规定了内部的Block-level Box如何布局，并且与这个区域外部毫不相干。

Block-level box:display 属性为 block, list-item, table 的元素，会生成 block-level box。

## 2. BFC的规矩规则
- 内部的Box会在垂直方向，一个接一个地放置。
- Box垂直方向的距离由margin决定。属于同一个BFC的两个相邻Box的margin会发生重叠。
- 每个盒子（块盒与行盒）的margin box的左边，与包含块border box的左边相接触(对于从左往右的格式化，否则相反)。即使存在浮动也是如此。
- BFC的区域不会与float box重叠。
- BFC就是页面上的一个隔离的独立容器，容器里面的子元素不会影响到外面的元素。反之也如此。
- 计算BFC的高度时，浮动元素也参与计算。

## 3. BFC的创建
- 根元素;
- float属性不为none;
- display属性为:line-block,table-cell,line-flex,flex;
- position属性不为:static,relative;
- overflow属性不为:visible;

## 4. BFC的作用
#### 4.1 自适应两栏布局
``` html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<style>
    *{
        margin: 0;
        padding: 0;
    }
    body {
        width: 100%;
        position: relative;
    }
 
    .left {
        width: 100px;
        height: 150px;
        float: left;
        background: rgb(139, 214, 78);
        text-align: center;
        line-height: 150px;
        font-size: 20px;
    }
 
    .right {
        height: 300px;
        background: rgb(170, 54, 236);
        text-align: center;
        line-height: 300px;
        font-size: 40px;
    }
</style>
<body>
    <div class="left">LEFT</div>
    <div class="right">RIGHT</div>
</body>
</html>
```
<img :src="$withBase('/imgs/bfc1.png')" alt="mixureSecure">

 这里并不是我们所想要的结果，我们所想要的是，一边为left，一边为right，这样是符合我们的想法的。所以我们可以将其中一个设置成一个bfc

 ``` html
 <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<style>
    *{
        margin: 0;
        padding: 0;
    }
    body {
        width: 100%;
        position: relative;
    }
 
    .left {
        width: 100px;
        height: 150px;
        float: left;
        background: rgb(139, 214, 78);
        text-align: center;
        line-height: 150px;
        font-size: 20px;
    }
 
    .right {
        overflow: hidden;
        height: 300px;
        background: rgb(170, 54, 236);
        text-align: center;
        line-height: 300px;
        font-size: 40px;
    }
</style>
<body>
    <div class="left">LEFT</div>
    <div class="right">RIGHT</div>
</body>
</html>
 ```

<img :src="$withBase('/imgs/bfc2.png')" alt="mixureSecure">

其实这里是运用了bfc的两条规则：
1. 每个盒子的margin box的左边，与包含块border box的左边相接触(对于从左往右的格式化，否则相反)。即使存在浮动也是如此。
2. BFC的区域不会与float box重叠。

#### 4.2 防止垂直margin重叠
``` html
<style>
    p {
        color: salmon;
        background-color: seashell;
        width: 200px;
        line-height: 100px;
        text-align: center;
        margin: 100px;
    }
</style>
<body>
    <p>box1</p>
    <p>box2</p>
</body>
```

<img :src="$withBase('/imgs/bfc3.png')" alt="mixureSecure">

这里其实我们的预想是，两个p标签的垂直距离是200px，而其实这里只有100px，是因为发生了边距重叠问题，那么我们也可以通过bfc解决这个问题。

```html
<style>
    .wrap{
        overflow: hidden;
    }
    p {
        color: salmon;
        background-color: seashell;
        width: 200px;
        line-height: 100px;
        text-align: center;
        margin: 100px;
    }
</style>
<body>
    <p class="wrap">box1</p>
    <p>box2</p>
</body>
```

<img :src="$withBase('/imgs/bfc4.png')" alt="mixureSecure">

其实这里是运用了bfc的两条规则：
1. Box垂直方向的距离由margin决定。属于同一个BFC的两个相邻Box的margin会发生重叠。
2. 内部的Box会在垂直方向，一个接一个地放置。

#### 4.3 清除浮动

当我们不给父节点设置高度，子节点设置浮动的时候，会发生高度塌陷，这个时候我们就要清楚浮动。

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>清除浮动</title>
</head>
<style>
    .par {
        border: 5px solid rgb(91, 243, 30);
        width: 300px;
    }
    
    .child {
        border: 5px solid rgb(233, 250, 84);
        width:100px;
        height: 100px;
        float: left;
    }
</style>
<body>
    <div class="par">
        <div class="child"></div>
        <div class="child"></div>
    </div>
</body>
</html>
```

<img :src="$withBase('/imgs/bfc5.png')" alt="mixureSecure">

出现了这种情况，我们就可以使用bfc去解决这个问题。给父节点激活BFC

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>清除浮动</title>
</head>
<style>
    .par {
        border: 5px solid rgb(91, 243, 30);
        width: 300px;
        overflow: hidden;
    }
    
    .child {
        border: 5px solid rgb(233, 250, 84);
        width:100px;
        height: 100px;
        float: left;
    }
</style>
<body>
    <div class="par">
        <div class="child"></div>
        <div class="child"></div>
    </div>
</body>
</html>
```

<img :src="$withBase('/imgs/bfc6.png')" alt="mixureSecure">

那么，我们就可以解决这个问题了。

这里是运用了bfc的一条规则：
1. 计算BFC的高度时，浮动元素也参与计算。
