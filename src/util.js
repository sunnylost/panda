
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