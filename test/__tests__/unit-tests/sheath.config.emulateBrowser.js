'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.config.emulateBrowser()', () => {
	it('is turned off on the server by default', () => {
		expect(sheath.config.emulateBrowser()).toBe(false)
	})
	
	it('can be modified during the config phase', () => {
		sheath.config.emulateBrowser(true)
		expect(sheath.config.emulateBrowser()).toBe(true)
	})
	
	it('cannot be modified after the config phase', () => {
		return new Promise(resolve => {
			setTimeout(resolve)
		}).then(result => {
			expect(sheath.config.emulateBrowser.bind(null, false)).toThrowError(/config phase/i)
		})
	})
})
