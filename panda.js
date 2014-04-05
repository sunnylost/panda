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

var ArrayProto  = Array.prototype;
var ObjectProto = Object.prototype;

var slice = ArrayProto.slice;
var toString = ObjectProto.toString;
var hasOwn   = ObjectProto.hasOwnProperty;

/**
 * 检测绝对路径
 * 	1，以 .js 结尾
 * 	2，以 / 开头
 * 	3，以 http 或 https 开头
 *
 *  对于绝对路径不做路径处理
 */
var rabsolutepath = /(^(?:http|https|\/)|\.(?=js$))/g;
var rkeywords = /require|module|exports/;
var rnocache  = /\?nocache=\d+/;

var CANNOT_FIND_NODE = 'Cannot find current script!';


function isArray(obj) {
	return toString.call(obj) === '[object Array]';
}

function toArray(obj) {
	return slice.call(obj, 0);
}

/**
 * 将 id 解析为绝对路径
 */
function convertIdToPath(id, baseUrl) {
	var node;
	if(!id) {
		node = getCurrentScript();
		if(!node) {
			throw new Error(CANNOT_FIND_NODE);
		}
		return node.src.replace(rnocache, '');
	}
	if(rabsolutepath.test(id)) return id; //绝对路径不做处理
	var pieces     = id.split('/');
	var len    	   = pieces.length;
	var configInfo = panda.configInfo;
	var paths  	   = configInfo.paths;
	var base       = configInfo.baseUrl;
	var tmp;

	base ? (base.lastIndexOf('/') == (base.length - 1) || (base += '/')) : (base = baseUrl || '');

	for(var i = 0; i < len; i++) {
		tmp = paths[pieces[i]];
		tmp && (pieces[i] = tmp);
	}
	tmpAnchor.href = base + pieces.join('/');
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
		//console.log('moduleMaps ', moduleMaps);
		//console.log('dependencyMaps ', dependencyMaps);
	};
	script.src = path + '?nocache=' + (+new Date());
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

var rrequireparams = /require\((['"])([^)]+?)\1\)/mg;

/**
 * 从函数源码中提取 require(xxx) 中的 xxx，即依赖的模块名
 */
function parseRequireParam(str) {
	var deps = str.match(rrequireparams);
	return deps ? (deps.forEach(function(v, i) {
		deps[i] = v.replace(rrequireparams, '$2');
	}), deps) : [];
}

/**
 * 配置信息
 */
function panda() {
}

panda.config = function(config) {
	var configInfo = panda.configInfo;
	for(var k in config) {
		if(hasOwn.call(config, k)) {
			configInfo[k] = config[k];
		}
	}
	this.configInfo = configInfo;
};

panda.configInfo = {

	paths: {}
};

/**
 * @TODO
 * 解决依赖
 */
function resolveDependencies(module) {
	var d,
		id = module.id,
		dms,
		exports = module.exports;

	dms = dependencyMaps[id];
	if(dms) {
		dms.forEach(function(m, i) {
			d = m.dependencies;
			d.forEach(function(dep) {
				if(!dep.isresolved && dep.id == id) {
					dep.isresolved = true;
					dep.value = exports;
					m.remain--;
				}
			})

			if(id == 'http://localhost:4000/panda/basic_require/c.js' && moduleMaps['http://localhost:4000/panda/basic_require/_test.js'].dependencies[1] === id) {
				debugger;
			}
			dms.splice(i, 1);
			if(!dms.length) {
				delete dependencyMaps[id];
			}
			if(!m.remain) {
				m.isresolved = true;
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
function require(id, factory) {
	if(!factory) {
		var m = moduleMaps[require.toUrl.call(this, id) + '.js'];
		return m && m.exports;
	} else {
		define(isArray(id) ? id : [id], factory);
	}
}

/**
 * 根据 id 返回模块绝对路径
 */
require.toUrl = require.resolve = function(id) {
	return convertIdToPath(id, this.baseURL);
};

/**
 * 封装一个新对象来模拟 require，主要是为了保持 this 状态
 */
require.proxy = function(obj) {
	var fn = require.bind(obj);
	fn.toUrl = fn.resolve = function(path) {
		return require.resolve.call(obj, path);
	};
	return fn;
}
function Module(option) {
	this.id = option.id;
	this.uri = option.uri;
	this.baseUrl = option.baseUrl;
	this.factory = option.factory;
	this.exports = {};
	var dep = this.dependencies = option.dependencies;
	/**
	 * 模块没有依赖，那么视为*已解决*
	 */
	(this.isresolved = !dep || !dep.length) && this.resolve();

	/**
	 * 还有多少依赖未解决
	 */
	this.remain = this.isresolved ? 0 : dep.length;
}

Module.prototype = {
	constructor: Module,

	/**
	 * @todo :是否存在循环依赖
	 */
	hasCircularReference: function(id) {
		var hasCircle = false;
		var hasDep    = false;
		var _id = this.id;

		var o = dependencyMaps[_id];
		if(o) {
			o.forEach(function(m) {
				m.id == id && (hasDep = true);
			})
		}
		o = dependencyMaps[id];
		if(o && hasDep) {
			o.some(function(m) {
				if(m.id == _id) {
					//console.log("Dependency Circle!");
					//console.log("A = " + a);
					//console.log("B = " + b);
					return hasCircle = true;
				}
			})
		}

		return hasCircle;
	},

	/**
	 * 加载模块
	 * @return {[type]} [description]
	 */
	load: function() {
		var module 		 = this;
		var dependencies = module.dependencies;
		var baseUrl 	 = module.baseUrl;
		var isresolved   = module.isresolved;
		var hasDept      = false; //不仅仅是依赖 require，module，exports

		var path;

		if(!isresolved) {
			dependencies.forEach(function(id, i) {
				if(rkeywords.test(id)) {
					module.remain--;
					var d = dependencies[i] = {
						id: id,
						isresolved: true
					};
					if(id == 'require') {
						d.value = require.proxy(module);
					} else if(id == 'module') {
						d.value = module;
					} else if(id == 'exports') {
						d.value = module.exports;
					}
					return;
				}

				hasDept = true;

				var m, deps;

				/**
				 * @todo: path 重复肿么办？
				 */
				id = convertIdToPath(id, baseUrl) + '.js';
				m = moduleMaps[id];  //将 id 替换为绝对路径
				/**
				 * 依赖采用新的结构
				 * 		id: 依赖模块 id
				 * 		isresolved: 依赖是否被解决
				 * 		value: 依赖的值
				 */
				dependencies[i] = {
					id: id,
					isresolved: false,
					value: m
				};

				/**
				 * module 依赖于 m
				 */
				(deps = dependencyMaps[id] || (dependencyMaps[id] = [])).push(module);

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
					if(module.hasCircularReference(id)) {
						dependencies[i] = moduleMaps[id] || {};
						deps.pop();

						if(i == dependencies.length - 1) {
							module.isresolved = true;
							module.resolve();
						}
						return;
					}
				} else {
					loadJs(id);
				}
			})

			if(!hasDept) {
				module.isresolved = true;
				module.resolve();
				resolveDependencies(module);
			}
		}
	},

	resolve: function() {
		var result;
		var defaultArgs  = [ require.proxy(this), this.exports, this];
		var dependencies = this.dependencies || [];
		var factory      = this.factory;
		var argLength    = factory.length;

		dependencies.forEach(function(v, i) {
			dependencies[i] = v.value;
		})

		if(argLength > dependencies.length) {
			dependencies = defaultArgs.concat(dependencies);
		}

		result = (typeof factory == 'function') ?
						factory.apply(null, dependencies.slice(0, argLength)) :
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
 * id:
 * 	The first argument, id, is a string literal. It specifies the id of the module being defined. This
 * 	argument is optional, and if it is not present, the module id should default to the id of the module
 * 	that the loader was requesting for the given response script. When present, the module id MUST be a
 * 	"top-level" or absolute id (relative ids are not allowed).
 *
 * id's format:
 * 	A module identifier is a String of "terms" delimited by forward slashes.
 * 	A term must be a camelCase identifier, ".", or "..".
 * 	Module identifiers may not have file-name extensions like ".js".
 * 	Module identifiers may be "relative" or "top-level". A module identifier is "relative" if the first term is "." or "..".
 * 	Top-level identifiers are resolved off the conceptual module name space root.
 * 	Relative identifiers are resolved relative to the identifier of the module in which "require" is written and called.
 * 	The CommonJS module id properties quoted above are normally used for JavaScript modules.
 *
 */
function define(id, dependencies, factory) {
	var argLen = arguments.length;
	var node;
	var src;
	var baseUrl;
	var lastIndex;

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

	baseUrl = panda.configInfo.baseUrl;
	if(!baseUrl) {
		node = getCurrentScript();
		if(!node) {
			throw Error(CANNOT_FIND_NODE)
		}
		src = node.src.replace(rnocache, '');
		baseUrl = src.substring(0, (lastIndex = src.lastIndexOf('/')) + 1);
		id = src;
	} else {
		src = id = convertIdToPath(id, baseUrl);
	}


	console.log('ID = ' + id);

	//dependencies = (dependencies ? dependencies : []).concat(parseRequireParam(factory ? factory.toString() : ''));
	/*cmdRequire = parseRequireParam(factory ? factory.toString() : '');

	cmdRequire.length && setTimeout(function() {
		define(cmdRequire, function() {});
	}, 0);*/

	(moduleMaps[id] = new Module({
		id:  id,
		baseUrl: baseUrl,
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
	 * 对外提供接口
	 */
	this.define = define;
	this.panda  = panda;

	/**
	 * 方便测试
	 */
	panda.dependencyMaps = dependencyMaps;
	panda.moduleMaps = moduleMaps;
}.call(this))