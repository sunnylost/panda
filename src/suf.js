
	/**
	 * 规范约定
	 */
	define.amd = {};

	/**
	 * 对外提供接口
	 */
	this.define = define;
	this.panda  = panda;

	/**
	 * 方便测试
	 */
	panda.dependencyMaps = dependencyMaps;
	panda.moduleMaps = moduleMaps;
}.call(this))