module.exports = {
    title: 'Vim blog',
    description: '微信号：wwy943265906',
    head: [ // 注入到当前页面的 HTML <head> 中的标签
        ['link', { rel: 'icon', href: '/logo.jpg' }], // 增加一个自定义的 favicon(网页标签的图标)
    ],
    base: '/', // 这是部署到github相关的配置
    markdown: {
        lineNumbers: true // 代码块显示行号
    },
    themeConfig: {
        nav:[ // 导航栏配置
            {text: '基础知识', link: '/basic/css/bfc'},
            {text: '进阶理解', link: '/advanced/promise/手撕promise'},
            {text: '源码分析', link: '/source/vue2/reactive'},
        ],
        sidebar: require("./sidebar.js"), // 侧边栏配置
        collapsable: true,
        lastUpdated: "Last Updated",
        searchMaxSuggestions: 10,
        // editLinks: true,
    },
    serviceWorker: true
};