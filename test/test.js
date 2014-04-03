/*define('test', ['require', 'a'], function(require, a) {
	require('a').intro()
})*/

panda.config({
	baseUrl: 'js',

	paths: {
		haha: 'lib'
	}
})

define(['1', '2', 'haha/3'], function(a, b, c) {
	console.log(a.name);
	console.log(b.name);
	console.log(c.name);
})