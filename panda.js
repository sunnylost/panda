/**
 * AMD spec: https://github.com/amdjs/amdjs-api/blob/master/AMD.md
 */
(function() {
	var
		moduleMaps = {},
		dependencyMaps = {},

		ArrayProto = Array.prototype,
		slice = ArrayProto.slice,

		risRelativePath = /^\./;

	function toArray(obj) {
		return slice.call(obj, 0);
	}

	/**
	 * 将相对路径解析为绝对路径
	 * @return {[type]} [description]
	 */
	function resolvePath(path, baseURL) {
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
			console.log(path + ' is loaded!');
			script.onload = null;
			setTimeout(function() {
				callback();
			})
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
	 * TODO
	 */
	function resolveDependencies(module) {
		var d,
			id = module.id,
			exports = module.exports;

		if(module.isresolved) {
			module = dependencyMaps[id];
			if(module) {
				module.forEach(function(m) {
					d = m.dependencies;
					d.every(function(depId, i) {
						if(depId == id) {
							d[i] = exports;
							return m.isresolved = true;
						} else if(typeof depId == 'string') {
							return m.isresolved = false;
						}
					})
					m.isresolved && m.run();
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
			this.factory.apply(this, this.dependencies);
		}
	};

	function require() {

	}

	function exports() {

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
			id:  src, //TODO, needs id
			uri: src,
			isresolved: !dependencies,
			factory: factory
		});

		if(dependencies) {
			dependencies.forEach(function(path) {
				path = resolvePath(path, baseURL) + '.js';

				var depModule = dependencyMaps[path] || (dependencyMaps[path] = []);
				depModule.push(module);
				module.dependencies.push(path)
				loadJs(path, function() {
					resolveDependencies(moduleMaps[path]);
				});
			})
		} else {
			result = factory.call(null, require, module.exports, module);
			if(typeof result == 'object') {
				module.exports = result;
			}

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
