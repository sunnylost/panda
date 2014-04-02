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