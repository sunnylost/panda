
/**
 * @TODO
 * 解决依赖
 */
function resolveDependencies(module) {
	var d,
		id = module.id,
		dms,
		exports = module.exports;

	dms = dependencyMaps[id] || dependencyMaps[id = module.uri];
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