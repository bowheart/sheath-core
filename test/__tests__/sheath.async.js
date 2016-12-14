'use strict'

const sheath = require('../../src/sheath')



describe('sheath.async()', () => {
	it('is turned on by default', () => {
		expect(sheath.async()).toBe(true)
	})
	
	it('can be modified during the config phase', () => {
		sheath.async(false)
		expect(sheath.async()).toBe(false)
	})
	
	it('cannot be modified after the config phase', () => {
		return new Promise((resolve) => {
			setTimeout(resolve)
		}).then((result) => {
			expect(sheath.async.bind(null, true)).toThrowError(/config phase/i)
		})
	})
})
