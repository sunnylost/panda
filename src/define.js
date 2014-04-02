/**
 *
 * @param  {[String]}    id
 * @param  {[Array]}     dependencies
 * @param  {[Function]}  factory
 * @return {[type]}
 */
function define(id, dependencies, factory) {
	var argLen = arguments.length,
		node,
		src,
		baseURL;

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

	node = getCurrentScript();
	if(!node) {
		throw Error('Cannot find current script!')
	}
	src = node.src.replace(rnocache, '');
	baseURL = src.substring(0, src.lastIndexOf('/') + 1);

	(moduleMaps[src] = new Module({
		id:  src, //@TODO, needs id
		baseURL: baseURL,
		uri: src,
		dependencies: dependencies,
		factory: factory
	})).load();
}