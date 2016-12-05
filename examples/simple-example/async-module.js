sheath('async-module', 'other-module', function(otherModule) {
	console.log('I am the async module!', otherModule)
})


sheath('other-module', function() {
	return 'this is the other module'
})
