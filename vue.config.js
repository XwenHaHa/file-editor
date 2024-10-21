const AutoImport = require("unplugin-auto-import/webpack");
const Components = require("unplugin-vue-components/webpack");
const { ElementPlusResolver } = require("unplugin-vue-components/resolvers");

const { defineConfig } = require("@vue/cli-service");
const path = require("path");

module.exports = defineConfig({
  publicPath: "./",
  lintOnSave: false,
  transpileDependencies: true,
  productionSourceMap: false, // 去除Vue打包后js目录下生成的一些.map文件，用于加速生产环境构建。
  //开发环境服务配置
  devServer: {
    hot: true,
    port: 8000,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  configureWebpack: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
      extensions: [".ts", ".tsx", ".js", ".json", ".vue"],
    },
    plugins: [
      // ...
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: "ts-loader",
          exclude: /node_modules/,
          options: {
            appendTsSuffixTo: [/\.vue$/],
            happyPackMode: true,
            transpileOnly: true,
          },
        },
      ],
    },
  },
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        // 设置打包之后的应用名称
        productName: "Sparke-IDE",
        win: {
          icon: "public/img/logo.png",
        },
        nsis: {
          // 是否一键安装，建议为 false，可以让用户点击下一步、下一步、下一步的形式安装程序，如果为true，当用户双击构建好的程序，自动安装程序并打开，即：一键安装（one-click installer）
          oneClick: false,
          // 允许请求提升。 如果为false，则用户必须使用提升的权限重新启动安装程序。
          allowElevation: true,
          // 允许修改安装目录，建议为 true，是否允许用户改变安装目录，默认是不允许
          allowToChangeInstallationDirectory: true,
          // 安装图标
          installerIcon: "public/img/logo.png",
          // 卸载图标
          uninstallerIcon: "public/img/logo.png",
          // 安装时头部图标
          installerHeaderIcon: "public/img/logo.png",
          // 创建桌面图标
          createDesktopShortcut: true,
          // 创建开始菜单图标
          createStartMenuShortcut: true,
        },
      },
      chainWebpackMainProcess: (config) => {
        config.plugin("define").tap((args) => {
          args[0].IS_ELECTRON = true;
          return args;
        });
      },
      chainWebpackRendererProcess: (config) => {
        config.plugin("define").tap((args) => {
          args[0].IS_ELECTRON = true;
          return args;
        });
      },
    },
  },
});
