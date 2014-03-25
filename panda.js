/**
 * AMD spec: https://github.com/amdjs/amdjs-api/blob/master/AMD.md
 */
(function() {
	var
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

		ArrayProto = Array.prototype,
		slice = ArrayProto.slice,

		rdotSlash = /\.\//g,
		risRelativePath = /^\./;

	function toArray(obj) {
		return slice.call(obj, 0);
	}

	/**
	 * @TODO 将相对路径解析为绝对路径
	 * @return {[type]} [description]
	 */
	function resolvePath(path, baseURL) {
		path = path.replace(rdotSlash, '');

		if(risRelativePath.test(path)) {
		}
		return baseURL + path;
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
					if(m.isresolved) {
						dms.splice(i, 1);
						if(!dms.length) {
							delete dependencyMaps[id];
						}
						m.run();
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
		this.isresolved = option.isresolved;
		this.factory = option.factory;
		this.exports = {};
		this.dependencies = [];
	}

	Module.prototype = {
		constructor: Module,

		run: function() {
			var result = this.factory.apply(this, this.dependencies);
			if(typeof result == 'object') {
				this.exports = result;
			}
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
			baseURL,
			module,
			result;

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
/*console.log(id);
console.log(dependencies);
console.log(factory);*/

		node = getCurrentScript();
		if(!node) {
			throw Error('Cannot find current script!')
		}
		src = node.src;
		baseURL = src.substring(0, src.lastIndexOf('/') + 1);

		module = moduleMaps[src] = new Module({
			id:  src, //@TODO, needs id
			uri: src,
			isresolved: !dependencies,
			factory: factory
		});

		if(dependencies) {
			dependencies.forEach(function(path) {
				path = resolvePath(path, baseURL) + '.js';

				(dependencyMaps[path] || (dependencyMaps[path] = [])).push(module);
				module.dependencies.push(path)
				loadJs(path);
			})
		} else {
			result = factory.call(null, require, module.exports, module);
			if(typeof result == 'object') {
				module.exports = result;
			}
			/**
			 * 模块已经没有依赖，解决其他依赖该模块的模块
			 */
			resolveDependencies(module);
		}
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
