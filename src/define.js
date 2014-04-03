/**
 *
 * @param  {[String]}    id
 * @param  {[Array]}     dependencies
 * @param  {[Function]}  factory
 * @return {[type]}
 */
function define(id, dependencies, factory) {
	var argLen = arguments.length;
	var node;
	var src;
	var baseUrl;
	var lastIndex;

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
	baseUrl = src.substring(0, (lastIndex = src.lastIndexOf('/')) + 1);

	id || (id = src.substring(lastIndex + 1).replace('.js', ''));
	//dependencies = (dependencies ? dependencies : []).concat(parseRequireParam(factory ? factory.toString() : ''));
	/*cmdRequire = parseRequireParam(factory ? factory.toString() : '');

	cmdRequire.length && setTimeout(function() {
		define(cmdRequire, function() {});
	}, 0);*/

	(moduleMaps[id] = new Module({
		id:  id,
		baseUrl: baseUrl,
		uri: src,
		dependencies: dependencies,
		factory: factory
	})).load();
}