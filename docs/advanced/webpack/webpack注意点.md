### 1.webpack是什么？
 - webpack是一个打包模块化js的工具，在webpack里一切文件皆模块，通过loader转换文件，通过plugin注入钩子，最后输出由多个模块组合成的文件，webpack专注构建模块化项目。

 - WebPack可以看做是模块的打包机器：它做的事情是，分析你的项目结构，找到js模块以及其它的一些浏览器不能直接运行的拓展语言，例如：Scss，TS等，并将其打包为合适的格式以供浏览器使用。

### 2.webpack与grunt、gulp的不同
 - 三者都是前端构建工具，grunt和gulp在早期比较流行，现在webpack相对来说比较主流，不过一些轻量化的任务还是会用gulp来处理，比如单独打包CSS文件等。


 - grunt和gulp是基于任务和流（Task、Stream）的。类似jQuery，找到一个（或一类）文件，对其做一系列链式操作，更新流上的数据， 整条链式操作构成了一个任务，多个任务就构成了整个web的构建流程。


 - webpack是基于入口的。webpack会自动地递归解析入口所需要加载的所有资源文件，然后用不同的Loader来处理不同的文件，用Plugin来扩展webpack功能。


所以，从构建思路来说，gulp和grunt需要开发者将整个前端构建过程拆分成多个`Task`，并合理控制所有`Task`的调用关系；webpack需要开发者找到入口，并需要清楚对于不同的资源应该使用什么Loader做何种解析和加工

对于知识背景来说，gulp更像后端开发者的思路，需要对于整个流程了如指掌。 webpack更倾向于前端开发者的思路 

### 3.什么是bundle,什么是chunk，什么是module? 
 - bundle：是由webpack打包出来的文件
 - chunk：代码块，一个chunk由多个模块组合而成，用于代码的合并和分割
 - module：是开发中的单个模块，在webpack的世界，一切皆模块，一个模块对应一个文件，webpack会从配置的entry中递归开始找出所有依赖的模块

### 4.什么是Loader?什么是Plugin?
 - Loaders是用来告诉webpack如何转化处理某一类型的文件，并且引入到打包出的文件中
 - Plugin是用来自定义webpack打包过程的方式，一个插件是含有apply方法的一个对象，通过这个方法可以参与到整个webpack打包的各个流程(生命周期)。

### 5.有哪些常见的Loader？他们是解决什么问题的？
 - file-loader：把文件输出到一个文件夹中，在代码中通过相对 URL 去引用输出的文件
 - url-loader：和 file-loader 类似，但是能在文件很小的情况下以 base64 的方式把文件内容注入到代码中去
 - source-map-loader：加载额外的 Source Map 文件，以方便断点调试
 - image-loader：加载并且压缩图片文件
 - babel-loader：把 ES6 转换成 ES5
 - css-loader：加载 CSS，支持模块化、压缩、文件导入等特性
 - style-loader：把 CSS 代码注入到 JavaScript 中，通过 DOM 操作去加载 CSS。
 - eslint-loader：通过 ESLint 检查 JavaScript 代码
 
### 6.常见的plugin？他们解决什么问题？
 - define-plugin：定义环境变量
 - commons-chunk-plugin：提取公共代码
 - uglifyjs-webpack-plugin：通过UglifyES压缩ES6代码
 
### 7.loader与plugin的不同之处
 - Loader直译为"加载器"。Webpack将一切文件视为模块，但是webpack原生是只能解析js文件，如果想将其他文件也打包的话，就会用到loader。 所以Loader的作用是让webpack拥有了加载和解析非JavaScript文件的能力。
 - Plugin直译为"插件"。Plugin可以扩展webpack的功能，让webpack具有更多的灵活性。 在 Webpack 运行的生命周期中会广播出许多事件，Plugin 可以监听这些事件，在合适的时机通过 Webpack 提供的 API 改变输出结果。
 
不同的用法Loader在module.rules中配置，也就是说他作为模块的解析规则而存在。 类型为数组，每一项都是一个Object，里面描述了对于什么类型的文件（test），使用什么加载(loader)和使用的参数（options）Plugin在plugins中单独配置。 类型为数组，每一项是一个plugin的实例，参数都通过构造函数传入。

### 8.webpack的构建流程是什么?
Webpack 的运行流程是一个串行的过程，从启动到结束会依次执行以下流程：
 - 初始化参数：从配置文件和 Shell 语句中读取与合并参数，得出最终的参数；

 - 开始编译：用上一步得到的参数初始化 Compiler 对象，加载所有配置的插件，执行对象的 run 方法开始执行编译；

 - 确定入口：根据配置中的 entry 找出所有的入口文件；

 - 编译模块：从入口文件出发，调用所有配置的 Loader 对模块进行翻译，再找出该模块依赖的模块，再递归本步骤直到所有入口依赖的文件都经过了本步骤的处理；

 - 完成模块编译：在经过第4步使用 Loader 翻译完所有模块后，得到了每个模块被翻译后的最终内容以及它们之间的依赖关系；

 - 输出资源：根据入口和模块之间的依赖关系，组装成一个个包含多个模块的Chunk，再把每个 Chunk 转换成一个单独的文件加入到输出列表，这步是可以修改输出内容的最后机会；

 - 输出完成：在确定好输出内容后，根据配置确定输出的路径和文件名，把文件内容写入到文件系统。

在以上过程中，Webpack 会在特定的时间点广播出特定的事件，插件在监听到感兴趣的事件后会执行特定的逻辑，并且插件可以调用 Webpack  提供的 API  改变Webpack 的运行结果。

### 9.描述一下编写loader或plugin的思路？
 - Loader像一个"翻译官"把读到的源文件内容转义成新的文件内容，并且每个Loader通过链式操作，将源文件一步步翻译成想要的样子。编写Loader时要遵循单一原则，每个Loader只做一种"转义"工作。 每个Loader的拿到的是源文件内容（source），可以通过返回值的方式将处理后的内容输出，也可以
调用this.callback()方法，将内容返回给webpack。  还可以通过 this.async()生成一个callback函数，再用这个callback将处理后的内容输出出去。 此外webpack还为开发者准备了开发loader的工具函数集——loader-utils。
- 相对于Loader而言，Plugin的编写就灵活了许多。 webpack在运行的生命周期中会广播出许多事件，Plugin 可以监听这些事件，在合适的时机通过 Webpack 提供的API 改变输出结果。

### 10.如何利用webpack来优化前端性能？
 - 用webpack优化前端性能是指优化webpack的输出结果，让打包的最终结果在浏览器运行快速高效。
 - 压缩代码。删除多余的代码、注释、简化代码的写法等等方式。可以利用webpack的UglifyJsPlugin和ParallelUglifyPlugin来压缩JS文件，利用cssnano（css-loader?minimize）来压缩css
 - 利用CDN加速。在构建过程中，将引用的静态资源路径修改为CDN上对应的路径。可以利用webpack对于output参数和各loader的publicPath参数来修改资源路径
 - 删除死代码（Tree Shaking）。将代码中永远不会走到的片段删除掉。可以通过在启动webpack时追加参数--optimize-minimize来实现
 - 提取公共代码。

### 11.如何提高webpack的构建速度？
 - 多入口情况下，使用CommonsChunkPlugin来提取公共代码
 - 通过externals配置来提取常用库利用DllPlugin和DllReferencePlugin预编译资源模块 
 - 通过DllPlugin来对那些我们引用但是绝对不会修改的npm包来进行预编译，再通过DllReferencePlugin将预编译的模块加载进来。
 - 使用Happypack 实现多线程加速编译使 
 - 用webpack-uglify-parallel来提 升uglifyPlugin的 压缩 速度 。 原 理上webpack-uglify-parallel采用了多核并行压缩来提升压缩速度
 - 使用Tree-shaking和Scope Hoisting来剔除多余代码

### 12.怎么配置单页应用？怎么配置多页应用？
- 单页应用可以理解为webpack的标准模式，直接在entry中指定单页应用的入口即可，这里不再赘述
- 多页应用的话，可以使用webpack的 AutoWebPlugin来完成简单自动化的构建，但是前提是项目的目录结构必须遵守他预设的规范。 
- 多页应用中要注意的是：每个页面都有公共的代码，可以将这些代码抽离出来，避免重复的加载。比如，每个页面都引用了同一套css样式表随着
- 业务的不断扩展，页面可能会不断的追加，所以一定要让入口的配置足够灵活，避免每次添加新页面还需要修改构建配置
