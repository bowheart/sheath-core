'use strict'

const sheath = require('../../src/sheath')



describe('sheath.devMode()', () => {
	it('is turned off by default', () => {
		expect(sheath.devMode()).toBe(false)
	})
	
	it('can be modified during the config phase', () => {
		sheath.devMode(true)
		expect(sheath.devMode()).toBe(true)
	})
	
	it('cannot be modified after the config phase', () => {
		return new Promise((resolve) => {
			setTimeout(resolve)
		}).then((result) => {
			expect(sheath.devMode.bind(null, false)).toThrowError(/config phase/i)
		})
	})
})
