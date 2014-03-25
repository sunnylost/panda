define('a', ['./level1/b', './level1/c'], function(b, c) {
	return {
		intro: function() {
			console.log('Hello, My name is A, and I have tow friends, their names are ' + b.name + ' and ' + c.name);
		}
	}
})