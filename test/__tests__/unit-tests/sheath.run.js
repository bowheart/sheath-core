'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.run()', () => {
	it('asserts that a function is passed', () => {
		expect(sheath.run.bind(null, 'func')).toThrowError(/must be a function/i)
		expect(sheath.run.bind(null, [], 'func')).toThrowError(/must be a function/i)
	})
	
	it('asserts that the deps is a string or array', () => {
		expect(sheath.run.bind(null, {}, () => {})).toThrowError(/string or array/i)
		expect(sheath.run.bind(null, [], () => {})).not.toThrow()
		console.warn = jest.fn()
		expect(sheath.run.bind(null, 'deps', () => {})).not.toThrow()
		expect(sheath.run.bind(null, () => {})).not.toThrow()
	})
	
	it('defers execution until the config phase is over', () => {
		return new Promise(resolve => {
			sheath.run(() => {
				resolve(sheath.phase())
			})
		}).then(result => {
			expect(result).toBe('sync')
		})
	})
	
	it('does not defer after the config phase when there are no dependencies', () => {
		return new Promise(resolve => {
			setTimeout(resolve)
		}).then(result => {
			let str = 'one'
			sheath.run(() => {
				str += 'two'
			})
			str += 'three'
			expect(str).toBe('onetwothree')
		})
	})
	
	it('injects a module', () => {
		return new Promise(resolve => {
			sheath('module1', () => 'visage1')
			sheath.run('module1', (module1) => {
				resolve(module1)
			})
		}).then(result => {
			expect(result).toBe('visage1')
		})
	})
	
	it('injects multiple modules', () => {
		return new Promise(resolve => {
			sheath('module2', () => 'visage2')
			sheath.run(['module1', 'module2'], (module1, module2) => {
				resolve(module1 + module2)
			})
		}).then(result => {
			expect(result).toBe('visage1visage2')
		})
	})
})
