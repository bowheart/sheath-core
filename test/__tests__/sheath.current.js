'use strict'

const sheath = require('../../src/sheath')



describe('sheath.current()', () => {
	it('logs a warning when called outside a module definition', () => {
		console.warn = jest.fn()
		sheath.current()
		expect(console.warn).toHaveBeenCalled()
	})
	
	it('returns the current of the module currently being defined', () => {
		return new Promise((resolve) => {
			sheath('module1', () => {
				resolve(sheath.current())
			})
		}).then((result) => {
			expect(result).toBe('module1')
		})
	})
	
	it('can be invoked by the module definition, but live outside it', () => {
		return new Promise((resolve) => {
			sheath('module2', 'nameGetter', (nameGetter) => {
				resolve(nameGetter())
			})
			sheath('nameGetter', () => () => {
				return sheath.current()
			})
		}).then((result) => {
			expect(result).toBe('module2')
		})
	})
})
