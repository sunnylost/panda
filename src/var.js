var global = this;

var doc = global.document;

	/**
	 * 保存全部模块引用
	 */
var moduleMaps = {};

	/**
	 * 保存需要依赖的模块
	 * 		key：依赖的模块名
	 * 		value：依赖 key 模块的所有模块
	 */
var dependencyMaps = {};

var tmpAnchor = doc.createElement('a');

var ArrayProto = Array.prototype;
var slice = ArrayProto.slice;

var rkeywords = /require|module|exports/;
var rnocache  = /\?nocache=\d+/;