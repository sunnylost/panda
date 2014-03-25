define('c', ['b'], function(b) {
	console.log('Ha, I find ' + b.name);
	return {
		name: 'C'
	}
})