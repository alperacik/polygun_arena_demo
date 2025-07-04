const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

module.exports = (env) => {
  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
      clean: true,
      publicPath: '',
    },
    module: {
      rules: [
        {
          test: /\.fbx$/,
          type: 'asset/inline',
          generator: {
            dataUrl: {
              mimetype: 'application/octet-stream',
            },
          },
        },
        {
          test: /\.png$/,
          type: 'asset/inline',
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        cache: false,
        inlineSource: '.(js|css)$',
        template: './src/template.html',
        inject: 'body',
      }),
      new HtmlInlineScriptPlugin(),
      new webpack.DefinePlugin({
        TARGET_CONFIG_NAME: JSON.stringify(env.TARGET_CONFIG_NAME),
      }),
    ],
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          extractComments: false, // ✅ disables LICENSE.txt
        }),
      ],
    },
    resolve: {
      extensions: ['.js'],
    },
    mode: 'development',
    devtool: env.mode === 'development' ? 'eval-source-map' : undefined,
    devServer: {
      compress: true,
      port: 9000,
      static: './dist',
    },
  };
};
