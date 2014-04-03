
function isArray(obj) {
	return toString.call(obj) === '[object Array]';
}

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
function loadJs(path, id) {
	var script = document.createElement('script');
	script.onload = function() {
		script.onload = null;
		script.parentNode.removeChild(script);
		var m = moduleMaps[path];
		m.id || (m.id = id);

		console.log('moduleMaps ', moduleMaps);
		console.log('dependencyMaps ', dependencyMaps);
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

/**
 * 从函数源码中提取 require(xxx) 中的 xxx，即依赖的模块名
 */
function parseRequireParam(str) {
	console.log(str);
}