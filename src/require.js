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