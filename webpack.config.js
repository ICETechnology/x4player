var path = require('path')
var webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
function getIPAdress() {
	var interfaces = require('os').networkInterfaces();
	var ip = "";
	for (var devName in interfaces) {
		var iface = interfaces[devName];
		for (var i = 0; i < iface.length; i++) {
			var alias = iface[i];
			if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
				ip = alias.address;
			}
		}
	}
	// for chin@home (解決 VPN 會產生另一組 local ip 的問題)
	for (var devName in interfaces) {
		var iface = interfaces[devName];
		for (var i = 0; i < iface.length; i++) {
			var alias = iface[i];
			if (alias.family === 'IPv4' && alias.address.indexOf(".72") !== -1) {
				ip = alias.address;
			}
		}
	}
	return ip;
}
const LOCAL_IP = getIPAdress();

console.log(`==========================================`);
const argv = require('yargs').argv
/** 專案代號直接決定 port 號 */
let devPort, mainJsPath;
switch(argv.env) {
	case 'app':
		devPort = 8090;
		mainJsPath = `./src/main.js`;
		break;
	case 'desktop':
		devPort = 8091;
		mainJsPath = `./src/main.desktop.js`;
		break;
}
console.log(`main file : `, mainJsPath);
console.log(`devPort : `, devPort);
console.log(`==========================================`);

module.exports = {
	entry: mainJsPath,
	output: {
		path: path.resolve(__dirname, './dist'),
		// 將 dev 與 production 切分 以支持 build 後可正確載入相對路徑的靜態資源
		publicPath: process.env.NODE_ENV==='development' ? `http://${LOCAL_IP}:${devPort}/dist/` : `./dist/`,

		filename: 'build.js'
	},
	module: {
		rules: [
		{
			test: /\.css$/,
			use: [
			'vue-style-loader',
			'css-loader'
			],
		}, {
			test: /\.worker\.js$/,
			use: {
				loader: 'worker-loader',
				options: { inline: true }
			}
		}, {
			test: /\.vue$/,
			loader: 'vue-loader',
			options: {
			loaders: {
				scss: [
				'vue-style-loader',
				'css-loader',
				{
					loader: 'sass-loader',
					options: {
					data: `
						@import "./src/css/flex";
						@import "./src/css/${argv.env==='desktop' ? 'index.desktop' : 'index'}";
					`
					}
				}
				]
			}
			// other vue-loader options go here
			}
		},
		{
			test: /\.js$/,
			loader: 'babel-loader',
			exclude: /node_modules/
		},
		{
			test: /\.(png|jpg|gif|svg)$/,
			loader: 'file-loader',
			options: {
			name: '[name].[ext]?[hash]'
			}
		},
		{
			test: /\.(woff2?|eot|ttf|otf)$/,
			loader: 'file-loader',
			options: {
				limit: 10000,
				name: '[name].[hash:7].[ext]'
			}
		},
		// {
		// 	test: /\.(woff2?|eot|ttf|otf)$/,
		// 	loader: 'url-loader',
		// 	options: {
		// 		publicPath: function(url) {
		// 			return `http://ss2-dev.icetech.com.tw/taishin.x4/dist/${url}`;
		// 		},
		// 		limit: 10000,
		// 		name: '[name].[hash:7].[ext]'
		// 	}
		// },
		// v-calendar插件需要加這段loader
		{
			test: /\.jsx?$/, 
			loader: 'babel-loader', 
			exclude: /node_modules\/(?!(v-calendar)\/).*/,
		}		
		]
	},
	resolve: {
		alias: {
		'vue$': 'vue/dist/vue.esm.js',
		'@': path.resolve('src'),
		},
		extensions: ['*', '.js', '.vue', '.json']
	},
	devServer: {
		host: LOCAL_IP,
		port: devPort,
		historyApiFallback: true,
		noInfo: true,
		overlay: true,
		headers: {
			'Cache-Control': 'max-age=31536000',
			'Access-Control-Allow-Origin': '*',
		},
		hotOnly: false,
		disableHostCheck: true,
	},
	performance: {
		hints: false
	},
	devtool: '#eval-source-map'
};

if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = '#source-map'
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
	new UglifyJsPlugin({
		"uglifyOptions": {
			compress: {
				warnings: false
			},
			sourceMap: true
		}
	}),	
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ])
}
