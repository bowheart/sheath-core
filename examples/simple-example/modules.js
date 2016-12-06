sheath('app', ['one', 'two', 'three'], function(one, two, three) {
	$('body').append([one, two, three].join('<br>'))
})


sheath('one', ['one-a', 'one-b', 'one-c'], function(a, b, c) {
	return 'one <br>' + [a, b, c].join('<br>')
})

sheath('one-a', function() {
	return 'one-a'
})

sheath('one-b', function() {
	return 'one-b'
})

sheath('one-c', ['one-c-i', 'one-c-ii'], function(one, two) {
	return 'one-c <br>' + [one, two].join('<br>')
})
sheath('one-c-i', function() {
	return 'one-c-i'
})
sheath('one-c-ii', function() {
	return 'one-c-ii'
})


sheath('two', function() {
	return 'two'
})


sheath('three', function() {
	return 'three'
})

sheath.devMode(true)
