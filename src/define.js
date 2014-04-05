/**
 *
 * id:
 * 	The first argument, id, is a string literal. It specifies the id of the module being defined. This
 * 	argument is optional, and if it is not present, the module id should default to the id of the module
 * 	that the loader was requesting for the given response script. When present, the module id MUST be a
 * 	"top-level" or absolute id (relative ids are not allowed).
 *
 * id's format:
 * 	A module identifier is a String of "terms" delimited by forward slashes.
 * 	A term must be a camelCase identifier, ".", or "..".
 * 	Module identifiers may not have file-name extensions like ".js".
 * 	Module identifiers may be "relative" or "top-level". A module identifier is "relative" if the first term is "." or "..".
 * 	Top-level identifiers are resolved off the conceptual module name space root.
 * 	Relative identifiers are resolved relative to the identifier of the module in which "require" is written and called.
 * 	The CommonJS module id properties quoted above are normally used for JavaScript modules.
 *
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

	baseUrl = curBaeUrl || panda.configInfo.baseUrl;
	if(!baseUrl) {
		node = getCurrentScript();
		if(node) {
			src = node.src.replace(rnocache, '');
			baseUrl = src.substring(0, (lastIndex = src.lastIndexOf('/')) + 1);
			if(!id) {
				id = src;
			}
		}
	}

	if(!id) {
		id = ANONYMOUS_MODULE + guid++;
	}

	if(risrelative.test(id)) {
		id = convertIdToPath(id);
	}

	(moduleMaps[id] = new Module({
		id:  id,
		baseUrl: baseUrl,
		uri: src,
		dependencies: dependencies,
		factory: factory
	})).load();
}