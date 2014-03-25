/**
 * AMD spec: https://github.com/amdjs/amdjs-api/blob/master/AMD.md
 */
(function() {
	var
		moduleMaps = {},

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
		return path;
	}

	/**
	 * 加载 JS
	 * @param  {[String]}   path
	 * @param  {Function}   callback
	 */
	function loadJs(path, callback) {
		var script = document.createElement('script');
		script.onload = function() {
			console.log(path + '.js is loaded!');
		};
		script.src = path + '.js';
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
		if(dependencies) {
			dependencies.forEach(function(path) {
				loadJs(resolvePath(path, baseURL));
			})
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
