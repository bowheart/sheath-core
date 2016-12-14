'use strict'

const sheath = require('../../src/sheath')



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
	
	it('loads undeclared modules asynchronously', () => {
		return new Promise((resolve) => {
			sheath('module5', 'test/async-module', (module) => {
				resolve(module)
				return 'visage5'
			})
		}).then((result) => {
			expect(result).toBe('async-visage')
		})
	})
})
