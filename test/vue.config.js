// const path = require("path");
// function resolve(dir) {
//   return path.join(__dirname, "..", dir);
// }

module.exports = {
  // 修改 src 目录 为 examples 目录
  pages: {
    index: {
      entry: "examples/main.js", //入口地址
      template: "public/index.html", //模板路径
      filename: "index.html" // 生成 html 的文件名
    }
  },
  // 扩展 webpack 配置，使 packages 加入编译
  chainWebpack: config => {
    config.module
      .rule('js')
      .include
      .add('packages')
      .end()
      .use('babel')
      .loader('babel-loader')
      .tap(options => {
        // 修改它的选项...
        return options
      })
  }
};