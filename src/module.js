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
				path = idMaps[path] = resolvePath(path, baseURL);
				dependencies[i] = path;
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
					loadJs(path + '.js?nocache=' + (+new Date()));
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