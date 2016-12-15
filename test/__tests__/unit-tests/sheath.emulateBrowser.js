'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.emulateBrowser()', () => {
	it('is turned off on the server by default', () => {
		expect(sheath.emulateBrowser()).toBe(false)
	})
	
	it('can be modified during the config phase', () => {
		sheath.emulateBrowser(true)
		expect(sheath.emulateBrowser()).toBe(true)
	})
	
	it('cannot be modified after the config phase', () => {
		return new Promise((resolve) => {
			setTimeout(resolve)
		}).then((result) => {
			expect(sheath.emulateBrowser.bind(null, false)).toThrowError(/config phase/i)
		})
	})
})
