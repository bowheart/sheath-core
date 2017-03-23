'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.current()', () => {
	it('returns the moduleInterface of the module currently being defined', () => {
		return new Promise(resolve => {
			sheath('module1', () => {
				resolve(sheath.current())
			})
		}).then(result => {
			expect(result.name).toBe('module1')
			expect(typeof result.exports).toBe('object')
		})
	})
	
	it('can be invoked by the module definition, but live outside it', () => {
		return new Promise(resolve => {
			sheath('module2', 'nameGetter', (nameGetter) => {
				resolve(nameGetter())
			})
			sheath('nameGetter', () => () => {
				return sheath.current().name
			})
		}).then(result => {
			expect(result).toBe('module2')
		})
	})
})
