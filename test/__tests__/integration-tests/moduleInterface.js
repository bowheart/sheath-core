'use strict'

const sheath = require('../../../src/sheath')



describe('moduleInterface objects', () => {
	it('is the context of bindable factories', () => {
		return new Promise(resolve => {
			sheath('module1', function() { // a bindable function
				resolve(this)
			})
		}).then(result => {
			expect(result.name).toBe('module1')
			expect(typeof result.exports).toBe('object')
		})
	})
	
	it('is otherwise accessible via `sheath.current()`', () => {
		return new Promise(resolve => {
			sheath('module2', () => { // an un-bindable function
				resolve(sheath.current())
			})
		}).then(result => {
			expect(result.name).toBe('module2')
			expect(typeof result.exports).toBe('object')
		})
	})
	
	it('has an unwritable name getter', () => {
		return new Promise(resolve => {
			sheath('module3', () => {
				let module = sheath.current()
				resolve(module)
			})
		}).then(result => {
			let nameChanger = function() {
				result.name = 'new-name'
			}
			expect(nameChanger).toThrowError(/cannot set property/i)
		})
	})
	
	it('provides an empty object as the default visage', () => {
		return new Promise(resolve => {
			sheath('module4', () => {
				let module = sheath.current()
				module.exports.a = 1
				resolve(module)
			})
		}).then(result => {
			expect(typeof result).toBe('object')
			expect(Object.keys(result)).toHaveLength(0)
			expect(Object.keys(result.exports)).toHaveLength(1)
			expect(result.exports.a).toBe(1)
		})
	})
	
	it('allows the default visage object to be overridden', () => {
		return new Promise(resolve => {
			sheath('module5', () => {
				let module = sheath.current()
				module.exports = undefined
			})
			sheath('module5/dependent', 'module5', resolve)
		}).then(result => {
			expect(result).toBe(undefined)
		})
	})
	
	it('gives a "return"ed visage priority -- it will override anything set on the "exports" object', () => {
		return new Promise(resolve => {
			sheath('module6', () => {
				let module = sheath.current()
				module.exports.a = 'one'
				return {a: 'two'}
			})
			sheath('module6/dependent', 'module6.a', resolve)
		}).then(result => {
			expect(result).toBe('two')
		})
	})
	
	it('can store other properties', () => {
		return new Promise(resolve => {
			sheath('module7', () => {
				let module = sheath.current()
				module.otherProp = 'value'
				resolve(module)
			})
		}).then(result => {
			expect(result.otherProp).toBe('value')
		})
	})
})
