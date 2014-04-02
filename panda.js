/**
 * AMD spec: https://github.com/amdjs/amdjs-api/blob/master/AMD.md
 */
(function() {
var global = this;

var doc = global.document;

	/**
	 * 保存全部模块引用
	 */
var moduleMaps = {};

	/**
	 * 保存需要依赖的模块
	 * 		key：依赖的模块名
	 * 		value：依赖 key 模块的所有模块
	 */
var dependencyMaps = {};

var tmpAnchor = doc.createElement('a');

var ArrayProto = Array.prototype;
var slice = ArrayProto.slice;

var rkeywords = /require|module|exports/;
var rnocache  = /\?nocache=\d+/;

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
 */
function loadJs(path) {
	var script = document.createElement('script');
	script.onload = function() {
		script.onload = null;
		script.parentNode.removeChild(script);
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
 * @todo :是否存在循环依赖
 */
function hasDependencyCircle(a, b) {
	var hasCircle = false;
	var hasDep    = false;

	var o = dependencyMaps[a];
	if(o) {
		o.forEach(function(m) {
			m.uri == b && (hasDep = true);
		})
	}
	o = dependencyMaps[b];
	if(o && hasDep) {
		o.some(function(m) {
			if(m.uri == a) {
				console.log("Dependency Circle!");
				console.log("A = " + a);
				console.log("B = " + b);
				return hasCircle = true;
			}
		})
	}

	return hasCircle;
}

/**
 * @TODO
 * 解决依赖
 */
function resolveDependencies(module) {
	var d,
		uri = module.uri,
		dms,
		exports = module.exports;

	dms = dependencyMaps[uri];
	if(dms) {
		dms.forEach(function(m, i) {
			d = m.dependencies;
			d.every(function(depUri, i) {
				if(depUri == uri) {
					d[i] = exports;

				/**
				 * @TODO
				 * 这里处理的草率了
				 * 模块也可能返回字符串
				 */
				} else if(typeof depUri == 'string') {
					return m.isresolved = false;
				}
				return m.isresolved = true;
			})
			dms.splice(i, 1);
			if(!dms.length) {
				delete dependencyMaps[uri];
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
/**
 * 根据 id 加载模块
 *
 * @todo :如果模块不存在，要抛异常吗？
 */
function require(id) {
	var m = moduleMaps[resolvePath(id, this.baseURL) + '.js'];
	return m && m.exports;
}

/**
 * 根据 id 返回模块绝对路径
 */
require.resolve = function(id) {
	return resolvePath(id, this.baseURL) + '.js';
};
function Module(option) {
	this.id = option.id;
	this.uri = option.uri;
	this.baseURL = option.baseURL;
	this.factory = option.factory;
	this.exports = {};
	var dep = this.dependencies = option.dependencies;
	/**
	 * 模块没有依赖，那么视为*已解决*
	 */
	(this.isresolved = !dep || !dep.length) && this.resolve();
}

Module.prototype = {
	constructor: Module,

	/**
	 * 加载模块
	 * @return {[type]} [description]
	 */
	load: function() {
		var module 		 = this;
		var dependencies = module.dependencies;
		var baseURL 	 = module.baseURL;
		var isresolved   = module.isresolved;

		if(!isresolved) {
			dependencies.forEach(function(path, i) {
				if(rkeywords.test(path)) {
					if(path == 'require') {
						dependencies[i] = require.bind(module);
					} else if(path == 'module') {
						dependencies[i] = module;
					} else if(path == 'exports') {
						dependencies[i] = module.exports;
					}
					if(i == dependencies.length - 1) {
						module.isresolved = true;
						module.resolve();
						resolveDependencies(module);
					}
					return;
				}

				var m, deps;

				/**
				 * @todo: path 重复肿么办？
				 */
				dependencies[i] = path = resolvePath(path, baseURL) + '.js';
				m = moduleMaps[path];  //将 id 替换为绝对路径

				/**
				 * module 依赖于 m
				 */
				(deps = dependencyMaps[path] || (dependencyMaps[path] = [])).push(module);

				/**
				 * 模块已加载，不用重复下载
				 */
				if(m) {
					if(m.isresolved) {
						return resolveDependencies(m);
					}
					/**
					 * @todo: 对于循环依赖的处理
					 *
					 * 例如 a 依赖于 b，b 依赖于 a，首先加载 a，然后加载 b
					 * 在加载 b 之后，发现它和 a 存在循环依赖
					 * 那么在此处将该依赖关系断开
					 *
					 * 这样处理草率吗？还有更好的办法吗？
					 */
					if(hasDependencyCircle(path, module.uri)) {
						dependencies[i] = {};
						deps.pop();

						if(i == dependencies.length - 1) {
							module.isresolved = true;
							module.resolve();
						}
						return;
					}
				} else {
					loadJs(path + '?nocache=' + (+new Date()));
				}
			})
		}
	},

	resolve: function() {
		var result,
			dependencies = this.dependencies || [],
			factory = this.factory;


		result = (typeof factory == 'function') ?
						factory.apply(null, dependencies.slice(0, factory.length)) :
						factory;

		/**
		 * factory 也可能是对象，例如
		 *     define({
		 *     	name: 'test'
		 *     })
		 *
		 *  按照 AMD 规范约定，凡是返回值能够转型为 true 的，都认为是模块 exports 的值
		 */
		if(!!result) {
			this.exports = result;
		}

		/**
		 * 模块已经没有依赖，解决其他依赖该模块的模块
		 */
		resolveDependencies(this);
	}
};
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
	src = node.src.replace(rnocache, '');
	baseURL = src.substring(0, src.lastIndexOf('/') + 1);

	(moduleMaps[src] = new Module({
		id:  id,
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