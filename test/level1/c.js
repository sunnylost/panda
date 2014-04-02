define('c', ['require', 'b'], function(require) {
	console.log('Ha, I find ' + require('b').name);
	return {
		name: 'C'
	}
})