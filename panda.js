/**
 * AMD spec: https://github.com/amdjs/amdjs-api/blob/master/AMD.md
 */
(function() {
	var
		global = this,

		doc = global.document,

		/**
		 * 保存全部模块引用
		 * @type {Object}
		 */
		moduleMaps = {},

		/**
		 * 保存需要依赖的模块
		 * 		key：依赖的模块名
		 * 		value：依赖 key 模块的所有模块
		 * @type {Object}
		 */
		dependencyMaps = {},

		tmpAnchor = doc.createElement('a'),

		ArrayProto = Array.prototype,
		slice = ArrayProto.slice;

	function toArray(obj) {
		return slice.call(obj, 0);
	}

	/**
	 * @TODO 将相对路径解析为绝对路径
	 * @return {[type]} [description]
	 */
	function resolvePath(path, baseURL) {
		tmpAnchor.href = baseURL + path;
		return tmpAnchor.href;
	}

	/**
	 * 加载 JS
	 * @param  {[String]}   path
	 * @param  {Function}   callback
	 */
	function loadJs(path, callback) {
		var script = document.createElement('script');
		script.onload = function() {
			script.onload = null;
		};
		script.src = path;
		document.head.appendChild(script);
	}

	/**
	 * 获取当前运行的脚本
	 * @return {[type]} script 元素
	 */
	function getCurrentScript() {
		/**
		 * https://developer.mozilla.org/en-US/docs/Web/API/document.currentScript
		 * IE 目前仍不支持
		 */
		var script = document.currentScript,
			scripts,
			len;
		if(script) {
			return script;
		} else {
			scripts = toArray(document.getElementsByTagName('script'));

			len = scripts.length;
			while(len--) {
				script = scripts[len];
				if(script.readyState == 'interactive') {
					return script;
				}
			}
		}
	}

	/**
	 * @TODO
	 * 解决依赖
	 */
	function resolveDependencies(module) {
		var d,
			id = module.id,
			dms,
			exports = module.exports;

		if(module.isresolved) {
			dms = dependencyMaps[id];
			if(dms) {
				dms.forEach(function(m, i) {
					d = m.dependencies;
					d.every(function(depId, i) {
						if(depId == id) {
							d[i] = exports;

						} else if(typeof depId == 'string') {
							return m.isresolved = false;
						}
						return m.isresolved = true;
					})
					dms.splice(i, 1);
					if(!dms.length) {
						delete dependencyMaps[id];
					}
					if(m.isresolved) {
						m.resolve();
						/**
						 * m 的依赖已经解决，然后解决依赖于 m 的模块
						 */
						resolveDependencies(m);
					}
				})
			}
		}
	}

	function Module(option) {
		this.id = option.id;
		this.uri = option.uri;
		this.baseURL = option.baseURL;
		this.factory = option.factory;
		this.exports = {};
		var dep = this.dependencies = option.dependencies;
		(this.isresolved = !dep || !dep.length) && this.resolve();
	}

	Module.prototype = {
		constructor: Module,

		/**
		 * 加载模块
		 * @return {[type]} [description]
		 */
		load: function() {
			var module 		 = this,
				factory 	 = module.factory,
				dependencies = module.dependencies,
				baseURL 	 = module.baseURL,
				isresolved   = module.isresolved,
				result;

			if(!isresolved) {
				dependencies.forEach(function(path, i) {
					if(path == 'require') {
						return dependencies[i] = require;
					} else if(path == 'module') {

					} else if(path == 'exports') {

					}

					var m;
					path = resolvePath(path, path.indexOf('./') == -1 ? '' : baseURL) + '.js?nocache=' + (+new Date());
					dependencies[i] = path;
					m = moduleMaps[path];  //将 id 替换为绝对路径

					(dependencyMaps[path] || (dependencyMaps[path] = [])).push(module);
					if(m && m.isresolved) {
						resolveDependencies(m);
						return;
					}
					loadJs(path);
				})
			}
		},

		resolve: function() {
			var result,
				factory = this.factory;

			/**
			 * factory 也可能是对象，例如
			 *     define({
			 *     	name: 'test'
			 *     })
			 */
			result = (typeof factory == 'function') ?
							factory.apply(null, this.dependencies.slice(0, factory.length)) :
							factory;

			if(typeof result == 'object') {
				this.exports = result;
			}

			/**
			 * 模块已经没有依赖，解决其他依赖该模块的模块
			 */
			resolveDependencies(this);
		}
	};

	function require() {
	}

	/**
	 *
	 * @param  {[String]}    id
	 * @param  {[Array]}     dependencies
	 * @param  {[Function]}  factory
	 * @return {[type]}
	 */
	function define(id, dependencies, factory) {
		var argLen = arguments.length,
			node,
			src,
			baseURL;

		/**
		 * 处理参数
		 * id 和 dependencies 均可省略
		 */
		if(argLen == 1) {
			factory = id;
			id = dependencies = null;
		} else if(argLen == 2) {
			if(typeof id != 'string') {
				factory = dependencies;
				dependencies = id;
				id = null;
			} else {
				factory = dependencies;
				dependencies = null;
			}
		}

		node = getCurrentScript();
		if(!node) {
			throw Error('Cannot find current script!')
		}
		src = node.src;
		baseURL = src.substring(0, src.lastIndexOf('/') + 1);

		(moduleMaps[src] = new Module({
			id:  src, //@TODO, needs id
			baseURL: baseURL,
			uri: src,
			dependencies: dependencies,
			factory: factory
		})).load();
	}

	/**
	 * 规范约定
	 */
	define.amd = {};

	/**
	 * 对外提供 define 接口
	 */
	this.define = define;
}.call(this))
