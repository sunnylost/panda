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