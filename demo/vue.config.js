// const path = require("path");
// const Timestamp = new Date().getTime();
module.exports = {
  publicPath: "/",
  
  // chainWebpack: config => {
  //   const types = ["vue-modules", "vue", "normal-modules", "normal"];
  //   types.forEach(type =>
  //     addStyleResource(config.module.rule("less").oneOf(type))
  //   );

  //   config.module
  //     .rule("images")
  //     .use("url-loader")
  //     .tap(() => {
  //       return {
  //         limit: 4096,
  //         fallback: {
  //           loader: "file-loader",
  //           options: {
  //             name: `images/[name].${Timestamp}.[ext]`
  //           }
  //         }
  //       };
  //     });
  // },

  pluginOptions: {
    'style-resources-loader': {
      preProcessor: 'less',
      patterns: [__dirname, "./src/assets/css/variable.less"]
    }
  },

  css: {
    loaderOptions: {
      less: {
        modifyVars:{
          '@mainColor':'#ff4444'
        },
        javascriptEnabled: true
      }
    }
  },

  
  devServer: {
    //port:8009
    port: 9997
  }
};

// function addStyleResource(rule) {
//   rule
//     .use("style-resource")
//     .loader("style-resources-loader")
//     .options({
//       patterns: [
//         path.resolve(__dirname, "src/css/variable.less") // 需要全局导入的less
//       ]
//     });
// }
