function Module(option) {
	this.id = option.id;
	this.uri = option.uri;
	this.baseUrl = option.baseUrl;
	this.factory = option.factory;
	this.exports = {};
	this.dependencyLength = option.dependencyLength;
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
		var baseUrl 	 = module.baseUrl;
		var isresolved   = module.isresolved;
		var hasDept      = false; //不仅仅是依赖 require，module，exports

		var path;

		if(!isresolved) {
			dependencies.forEach(function(id, i) {
				if(rkeywords.test(id)) {
					if(id == 'require') {
						dependencies[i] = require.proxy(module);
					} else if(id == 'module') {
						dependencies[i] = module;
					} else if(id == 'exports') {
						dependencies[i] = module.exports;
					}
					return;
				}

				hasDept = true;

				var m, deps;

				/**
				 * @todo: path 重复肿么办？
				 */
				path = convertIdToPath(id, baseUrl) + '.js';
				m = moduleMaps[id];  //将 id 替换为绝对路径

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
					if(hasDependencyCircle(id, module.id)) {
						dependencies[i] = moduleMaps[id] || {};
						deps.pop();

						if(i == dependencies.length - 1) {
							module.isresolved = true;
							module.resolve();
						}
						return;
					}
				} else {
					loadJs(path);
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