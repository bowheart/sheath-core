sheath('app', [
	'weapons',
	'config.user',
	'async-module'
], function(weapons, user) {
	console.log(user)
	$('body').append(weapons.view())
})


sheath('weapons', ['weapons > dirk', 'weapons > sword'], function(dirk, sword) {
	return {
		view: function() {
			return dirk.view().add(sword.view())
		}
	}
})


sheath('weapons > dirk', 'Weapon', function(Weapon) {
	return sheath.object(Weapon, {
		name: 'dirk'
	})
})


sheath('weapons > sword', 'Weapon', function(Weapon) {
	return sheath.object(Weapon, {
		name: 'sword'
	})
})


sheath('Weapon', function() {
	return sheath.object({
		view: function() {
			return $('<section><h1>' + this.name + '</h1></section>')
		}
	})
})


sheath('config', function() {
	sheath.export('user', {name: 'Bob'})
})
