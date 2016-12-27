'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.portal()', () => {
	it('is a "." character by default', () => {
		expect(sheath.portal()).toBe('.')
	})
	
	it('can be modified during the config phase', () => {
		sheath.portal('')
		expect(sheath.portal()).toBe('')
	})
	
	it('must be a string, when specified', () => {
		expect(sheath.portal.bind(null, 33)).toThrowError(/must be a string/i)
	})
	
	it('can be chained', () => {
		sheath.portal('.').portal('::')
		expect(sheath.portal()).toBe('::')
	})
	
	it('cannot be modified after the config phase', () => {
		return new Promise(resolve => {
			setTimeout(resolve)
		}).then(result => {
			expect(sheath.portal.bind(null, '>')).toThrowError(/config phase/i)
		})
	})
})
