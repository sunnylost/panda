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

var ArrayProto  = Array.prototype;
var ObjectProto = Object.prototype;

var slice = ArrayProto.slice;
var toString = ObjectProto.toString;
var hasOwn   = ObjectProto.hasOwnProperty;

/**
 * 检测绝对路径
 * 	1，以 .js 结尾
 * 	2，以 / 开头
 * 	3，以 http 或 https 开头
 *
 *  对于绝对路径不做路径处理
 */
var rabsolutepath = /(^(?:http|https|\/)|\.(?=js$))/g;
var risrelative   = /^\.{1,2}/;
var rkeywords = /require|module|exports/;
var rnocache  = /\?nocache=\d+/;

var guid = 0;
var ANONYMOUS_MODULE = 'anonymous';

var curBaeUrl;

var CANNOT_FIND_NODE = 'Cannot find current script!';
