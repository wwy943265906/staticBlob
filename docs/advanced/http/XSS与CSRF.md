# XSS及CSRF攻击防御

## 1. XSS

XSS (Cross Site Scripting)，即跨站脚本攻击，是一种常见于 Web 应用中的计算机安全漏洞。恶意攻击者往 Web 页面里嵌入恶意的客户端脚本，当用户浏览此网页时，脚本就会在用户的浏览器上执行，进而达到攻击者的目的。

### 攻击原理
不需要你做任何的登录认证，它会通过合法的操作（比如在url中输入、在评论框中输入），向你的页面注入脚本（可能是js、hmtl代码块等）。

### 危害
- 窃取Cookie。
- 监听用户行为，比如输入账号密码后直接发送到黑客服务器。
- 修改 DOM 伪造登录表单。
- 在页面中生成浮窗广告。

### 攻击类型
通常情况，XSS 攻击的实现有三种方式——存储型、反射型和文档型。

#### 1. 反射型
反射型XSS指的是恶意脚本作为网络请求的一部分。

用户在页面输入框中输入数据，通过 get 或者 post 方法向服务器端传递数据，输入的数据一般是放在 URL 的 query string 中，或者是 form 表单中，如果服务端没有对这些数据进行过滤、验证或者编码，直接将用户输入的数据呈现出来，就可能会造成反射型 XSS。

例如：
``` js
http://sanyuan.com?q=<script>alert("你完蛋了")</script>
```
这样，在服务器端会拿到q参数,然后将内容返回给浏览器端，浏览器将这些内容作为HTML的一部分解析，发现是一个脚本，直接执行，这样就被攻击了。

#### 2. 持久型
通常是因为服务器端将用户输入的恶意脚本没有经过验证就存储在数据库中，并且通过调用数据库的方式，将数据呈现在浏览器上，当页面被用户打开的时候执行，每当用户打开浏览器，恶意脚本就会执行。持久型的 XSS 攻击相比非持久型的危害性更大，因为每当用户打开页面，恶意脚本都会执行。

例如在页面的输入中输入了一段脚本，而且没有经过验证或者转义，直接将数据存入数据库，则后面页面渲染时拿出来时便会执行这一脚本，达到攻击的目的。可怕的是，这种是每一次打开页面都会执行一次，并不是一次性攻击。

#### 3. 文档型
DOM型XSS是基于DOM文档对象模型的。对于浏览器来说，DOM文档就是一份XML文档，当有了这个标准的技术之后，通过JavaScript就可以轻松的访问DOM。当确认客户端代码中有DOM型XSS漏洞时，诱使(钓鱼)一名用户访问自己构造的URL，利用步骤和反射型很类似，但是唯一的区别就是，构造的URL参数不用发送到服务器端，可以达到绕过WAF、躲避服务端的检测效果。

例如：
``` js
<html>
    <head>
        <title>DOM Based XSS Demo</title>
        <script>
        function xsstest()
        {
        var str = document.getElementById("input").value;
        document.getElementById("output").innerHTML = "<img
        src='"+str+"'></img>";
        }
        </script>
    </head>
    <body>
    <div id="output"></div>
    <input type="text" id="input" size=50 value="" />
    <input type="button" value="submit" onclick="xsstest()" />
    </body>
</html>
```
在这段代码中，submit按钮的onclick事件调用了xsstest()函数。而在xsstest()中，修改了页面的DOM节点，通过innerHTML把一段用户数据当作HTML写入到页面中，造成了DOM Based XSS。

#### 解决方法
1. 编码
- 对用户输入的数据进行 HTML Entity 编码。
- Encode的作用是将等一些字符进行转化，使得浏览器在最终输出结果上是一样的。
2. 过滤
移除用户输入的和事件相关的属性。如onerror可以自动触发攻击，还有onclick等。移除用户输入的Style节点、Script节点、Iframe节点。（尤其是Script节点，它可是支持跨域的呀，一定要移除）。
3. 校正
避免直接对HTML Entity进行解码。使用DOM Parse转换，校正不配对的DOM标签。
4. Http Only cookie
许多 XSS 攻击的目的就是为了获取用户的 cookie，将重要的 cookie 标记为 http only，这样的话当浏览器向服务端发起请求时就会带上 cookie 字段，但是在脚本中却不能访问 cookie，这样就避免了 XSS 攻击利用 js 的 document.cookie获取 cookie。
5. 利用csp可以减少xss攻击（不熟，可自行查找资料）


## 2. CSRF
跨站请求伪造（英语：Cross-site request forgery），也被称为 one-click attack 或者 session riding，通常缩写为 CSRF 或者 XSRF， 是一种挟制用户在当前已登录的Web应用程序上执行非本意的操作的攻击方法


#### 攻击原理
1. 用户C打开浏览器，访问受信任网站A，输入用户名和密码请求登录网站A；
2. 在用户信息通过验证后，网站A产生Cookie信息并返回给浏览器，此时用户登录网站A成功，可以正常发送请求到网站A；
3. 用户未退出网站A之前，在同一浏览器中，打开一个TAB页访问网站B；
4. 网站B接收到用户请求后，返回一些攻击性代码，并发出一个请求要求访问第三方站点A；
5. 浏览器在接收到这些攻击性代码后，根据网站B的请求，在用户不知情的情况下携带Cookie信息，向网站A发出请求。网站A并不知道该请求其实是由B发起的，所以会根据用户C的Cookie信息以C的权限处理该请求，导致来自网站B的恶意代码被执行。 

#### 解决方法
1. 验证 HTTP Referer 字段
在request header中，有个referer字段，表明请求的来源，服务端可以通过这个字段判断是否是在合法的网站下发送的请求。

缺陷：Referer的值是由浏览器提供的，不同的浏览器实现不同，无法确保某些浏览器是否有安全漏洞，导致可以自行修改Referer字段

2. 表单 token检测
由服务端生成一个token，返回给前端，在每次发送请求中，在参数中额外参加一个参数。

3. header中增加csrf_token
由后端生成csrf_token设置在cookie中， 前端获取到token后设置在header中，可以统一在封装request方法时写入。

如下：
``` js
let csrfToken = Cookies.get('csrfToken');

$.ajaxSetup({
  beforeSend: function(xhr, settings) {
      xhr.setRequestHeader('x-csrf-token', csrfToken);
  }
});
```

4. 利用cookie的SameSite属性
CSRF攻击中重要的一环就是自动发送目标站点下的 Cookie,然后就是这一份 Cookie 模拟了用户的身份。因此在Cookie上面下文章是防范的不二之选。
恰好，在 Cookie 当中有一个关键的字段，可以对请求中 Cookie 的携带作一些限制，这个字段就是SameSite。

SameSite可以设置为三个值，Strict、Lax和None。

- 在Strict模式下，浏览器完全禁止第三方请求携带Cookie。比如请求sanyuan.com网站只能在sanyuan.com域名当中请求才能携带 Cookie，在其他网站请求都不能。
- 在Lax模式，就宽松一点了，但是只能在 get 方法提交表单况或者a 标签发送 get 请求的情况下可以携带 Cookie，其他情况均不能。
- 在None模式下，也就是默认模式，请求会自动携带上 Cookie。

## 参考链接
[xss与crsf](https://juejin.cn/post/6844904021308735502#heading-74)  
[CSRF攻击原理与常见解决方案](https://segmentfault.com/a/1190000037725856?utm_source=tag-newest)