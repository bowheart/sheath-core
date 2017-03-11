'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.config.async()', () => {
	it('is turned on by default', () => {
		expect(sheath.config.async()).toBe(true)
	})
	
	it('can be modified during the config phase', () => {
		sheath.config.async(false)
		expect(sheath.config.async()).toBe(false)
	})
	
	it('cannot be modified after the config phase', () => {
		return new Promise(resolve => {
			setTimeout(resolve)
		}).then(result => {
			expect(sheath.config.async.bind(null, true)).toThrowError(/config phase/i)
		})
	})
})
