// Setup
sheath.mode('dev').lib
	('$', 'jQuery', 'https://ajax.googleapis.com/ajax/libs/jquery/3.1.0/jquery.min.js')
	('_', 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.4/lodash.min.js')
	('moment', 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.17.1/moment.min.js')

// Modules
sheath('app', ['one', 'two', 'three', 'async-module'], function(one, two, three, asyncModule) {
	$('body').append([one, two, three].join('<br>'))
})


sheath('one', ['./a', './b', './c'], function(a, b, c) {
	return 'one<br>' + [a, b, c].join('<br>')
})

sheath('one/a', function() {
	return 'one-a'
})

sheath('one/b', function() {
	return 'one-b'
})

sheath('one/c', ['./i', './ii'], function(one, two) {
	return 'one-c<br>' + [one, two].join('<br>')
})
sheath('one/c/i', function() {
	return 'one-c-i'
})
sheath('one/c/ii', function() {
	return 'one-c-ii'
})


sheath('two', function() {
	return 'two'
})


sheath('three', function() {
	return 'three'
})
