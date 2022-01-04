const webpack = require('webpack')

const PUBLIC_PATH = process.env.VUE_APP_PUBLIC_PATH
const API_URL = process.env.VUE_APP_API_URL
const RECORDS_URL = process.env.VUE_APP_RECORDS_API
const JANUS_URL = process.env.VUE_APP_JANUS_URL

module.exports = {
  publicPath: PUBLIC_PATH,
  devServer: {
    open: process.platform === 'darwin',
    host: '0.0.0.0',
    port: 8081, // CHANGE YOUR PORT HERE!
    https: false,
    hotOnly: false,
    disableHostCheck: true,
    proxy: {
      '/api': {
        target: API_URL,
        pathRewrite: { '^/api': '' },
        secure: false,
        changeOrigin: true
      },
      '/janus': {
        target: JANUS_URL,
        pathRewrite: { '^/janus': '' },
        secure: false,
        changeOrigin: true
      },
      '/records': {
        target: RECORDS_URL,
        pathRewrite: { '^/records': '' },
        secure: false,
        changeOrigin: true
      },
    }
  },
  css: {
    loaderOptions: {
      sass: {
        additionalData: `@import "./src/assets/styles/_variables.scss";`,
        sassOptions: {
          // sourceMap: true
        }
      }
    }
  },
  configureWebpack: {
    plugins: [
      // janus.js does not use 'import' to access to the functionality of webrtc-adapter,
      // instead it expects a global object called 'adapter' for that.
      // Let's make that object available.
      new webpack.ProvidePlugin({ adapter: ['webrtc-adapter', 'default'] })
    ],
    module: {
      rules: [
        // janus.js does not use 'export' to provide its functionality to others, instead
        // it creates a global variable called 'Janus' and expects consumers to use it.
        // Let's use 'exports-loader' to simulate it uses 'export'.
        {
          test: require.resolve('janus-gateway'),
          loader: 'exports-loader',
          options: {
            exports: 'Janus',
          },
        }
      ]
    },
  },
}
