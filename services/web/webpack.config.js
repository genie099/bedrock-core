// Note:
//
// To enable multiple builds, place each app in
// a folder inside src, add them to "default"
// args below, and move the html template to
// src/common/index.html.

const path = require('path');
const yargs = require('yargs');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');

const argv = yargs.boolean('p').boolean('analyze').option('app', {
  alias: 'a',
  array: true,
  // Add multiple app names here.
  default: [],
}).argv;

// Note that webpack has deprecated the -p flag and now uses "mode".
// Additionally NODE_ENV seems to affect the build as well.
const BUILD = process.env.NODE_ENV === 'production';

// Strip NODE_ENV env vars as they only make
// sense during runtime.
const { DEV, STAGING, PROD, ...rest } = require('./env');

const ENV = {
  BUILD,
  ...rest,
};

if (argv.analyze && !BUILD) {
  throw new Error('Analyze mode must be used with -p flag. Use yarn build --analyze.');
}

module.exports = {
  mode: BUILD ? 'production' : 'development',
  devtool: BUILD ? 'source-map' : 'cheap-module-source-map',
  entry: getEntryPoints(),
  output: {
    publicPath: '/',
    filename: 'assets/[name].[contenthash].js',
    assetModuleFilename: 'assets/[contenthash][ext]',
  },
  resolve: {
    alias: {
      'react-dom': '@hot-loader/react-dom',
      '../../theme.config$': path.resolve(path.join(__dirname, 'src'), 'theme/theme.config'),
    },
    extensions: ['.js', '.json', '.jsx'],
    modules: [path.join(__dirname, 'src'), 'node_modules'],
    // Node core modules were previously shimmed in webpack < v5.
    // These must now be opted into via the "fallback" option.
    fallback: {
      path: false,
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        type: 'javascript/auto',
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(css|less)$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', ...(BUILD ? ['postcss-loader'] : []), 'less-loader'],
      },
      {
        test: /\.(png|jpg|svg|gif|mp4|pdf|eot|ttf|woff2?)$/,
        type: 'asset/resource',
      },
      {
        test: /\.md$/,
        type: 'asset/source',
      },
      {
        test: /\.html$/i,
        exclude: /index\.html$/,
        loader: path.resolve('./src/utils/loaders/templateParams'),
        options: {
          // Expose template params used in partials included with
          // require('path/to/template.html') in the same way as the
          // main template.
          params: ENV,
        }
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'assets/[name]-[contenthash].css',
    }),
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      failOnError: true,
      cwd: process.cwd(),
    }),
    ...getTemplatePlugins(),
    ...getOptionalPlugins(),

    // Favicons plugin occasionally makes webpack build fail due with error:
    // glib: SVG has no elements
    //
    // This error is intermittent and tracked here:
    // https://github.com/jantimon/favicons-webpack-plugin/issues/200
    new FaviconsWebpackPlugin({
      logo: './src/assets/favicon.svg',

      // Enable this line to test PWA stuff on dev.
      // devMode: 'webapp',

      // https://github.com/itgalaxy/favicons#usage
      favicons: {
        appName: '',                              // Your application's name.
        dir: 'auto',                              // Primary text direction for name, short_name, and description
        lang: 'en-US',                            // Primary language for name and short_name
        background: '#fff',                       // Background colour for flattened icons.
        theme_color: '#fff',                      // Theme color user for example in Android's task switcher.
        appleStatusBarStyle: 'black-translucent', // Style for Apple status bar: "black-translucent", "default", "black". Not actually black!.
        display: 'fullscreen',                    // Preferred display mode: "fullscreen", "standalone", "minimal-ui" or "browser".
        orientation: 'portrait',                  // Default orientation: "any", "natural", "portrait" or "landscape".
        loadManifestWithCredentials: true,        // Browsers don't send cookies when fetching a manifest, enable this to fix that.
        icons: {
          android: true,
          appleIcon: true,
          appleStartup: true,
          coast: false,
          favicons: true,
          firefox: true,
          windows: true,
          yandex: false,
        }
      },
    }),
  ],

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          mangle: false,
          output: {
            comments: false
          },
        }
      }),
    ],
  },
};

// koa-webpack -> webpack-hot-client requires this to be wrapped in an array
// https://github.com/webpack-contrib/webpack-hot-client/issues/11
function getEntryPoints() {
  const apps = argv.app;
  const entryPoints = {};
  if (apps.length === 0) {
    entryPoints['public'] = ['./src/index'];
  } else {
    for (let app of apps) {
      entryPoints[app] = [`./src/${app}/index`];
    }
  }
  return entryPoints;
}

function getTemplatePlugins() {
  let apps = argv.app;
  let template;
  if (apps.length > 0) {
    template = 'src/common/index.html';
  } else {
    apps = ['public'];
    template = 'src/index.html';
  }
  return apps.map((app) => {
    return new HtmlWebpackPlugin({
      template,
      chunks: [app, 'vendor'],
      templateParameters: {
        app,
        ...ENV,
      },
      minify: {
        removeComments: false,
        collapseWhitespace: true,
      },
      filename: path.join(app === 'public' ? '' : app, 'index.html'),
      inject: true,
    });
  });
}

function getOptionalPlugins() {
  const plugins = [];
  if (argv.analyze) {
    const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
    plugins.push(new BundleAnalyzerPlugin());
  }
  return plugins;
}
