define('a', ['./level1/b'], function(b) {
	return {
		intro: 'My name is A. And let me introduce another friend! His is ' + b.name
	}
})