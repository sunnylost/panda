define('a', ['require', './level1/b', './level1/c'], function(require) {
	return {
		intro: function() {
			console.log('Hello, My name is A, and I have tow friends, their names are ' + require('./level1/b').name + ' and ' + require('./level1/c').name);
		}
	}
})