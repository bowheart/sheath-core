'use strict'

const sheath = require('../src/sheath')



describe('sheath()', () => {
	it('creates a module', () => {
		return new Promise((resolve) => {
			sheath('module1', () => {
				resolve('module created')
				return 'visage1'
			})
		}).then((result) => {
			expect(result).toBe('module created')
		})
	})
	
	it('injects a module', () => {
		return new Promise((resolve) => {
			sheath('module2', 'module1', (module1) => {
				resolve(module1)
				return 'visage2'
			})
		}).then((visage) => {
			expect(visage).toBe('visage1')
		})
	})
	
	it('waits for dependencies to be defined before injecting', () => {
		return new Promise((resolve) => {
			sheath('module3', 'module3b', (module3b) => {
				resolve(module3b)
				return 'visage3'
			})
			
			sheath('module3b', () => 'visage3b')
		}).then((visage) => {
			expect(visage).toBe('visage3b')
		})
	})
	
	it('injects multiple modules', () => {
		return new Promise((resolve) => {
			sheath('module4', ['module1', 'module3'], (module1, module3) => {
				resolve(module1 + module3)
				return 'visage4'
			})
		}).then((result) => {
			expect(result).toBe('visage1visage3')
		})
	})
})



describe('sheath.const()', () => {
	it('sets an individual value', () => {
		sheath.const('key1', 'val1')
		expect(sheath.const('key1')).toBe('val1')
	})
	
	it('sets multiple values', () => {
		sheath.const({
			key2: 'val2',
			key3: 'val3'
		})
		expect(sheath.const('key2')).toBe('val2')
		expect(sheath.const('key3')).toBe('val3')
	})
	
	it('freezes objects', () => {
		let arr = [1, 3, 5]
		sheath.const('key4', arr)
		expect(Object.isFrozen(sheath.const('key4'))).toBe(true)
	})
	
	it('disallows overrides', () => {
		expect(sheath.const.bind(null, 'key1', 'new-val')).toThrowError(/overwrite disallowed/i)
	})
})
