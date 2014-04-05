/**
 * 根据 id 加载模块
 *
 * @todo :如果模块不存在，要抛异常吗？
 */
function require(id, factory) {
	var m;

	if(!factory) {
		m = moduleMaps[require.toUrl.call(this, id) + '.js'];
		return m && m.exports;
	} else {
		curBaeUrl = this.baseUrl;
		define(ANONYMOUS_MODULE + guid++, isArray(id) ? id : [id], factory);
		curBaeUrl = '';
		/*(isArray(id) ? id : [id]).forEach(function(v, i) {
			m = moduleMaps[convertIdToPath(v, )];
		})*/
/*		m = new Module({
			id: id,
			src: id,
			baseUrl: this.baseUrl,
			dependencies: isArray(id) ? id : [id],
			factory: factory
		})

		m.load();*/
	}
}

/**
 * 根据 id 返回模块绝对路径
 */
require.toUrl = require.resolve = function(id) {
	return convertIdToPath(id, this.baseUrl);
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