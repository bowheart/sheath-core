'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.separator()', () => {
	it('is a "/" character by default', () => {
		expect(sheath.separator()).toBe('/')
	})
	
	it('can be modified during the config phase', () => {
		sheath.separator('')
		expect(sheath.separator()).toBe('')
	})
	
	it('must be a string, when specified', () => {
		expect(sheath.separator.bind(null, 33)).toThrowError(/must be a string/i)
	})
	
	it('can be chained', () => {
		sheath.separator('>').separator('::')
		expect(sheath.separator()).toBe('::')
	})
	
	it('cannot be set to the accessor', () => {
		expect(sheath.separator.bind(null, sheath.accessor())).toThrowError(/cannot be the same/i)
	})
	
	it('cannot be modified after the config phase', () => {
		return new Promise(resolve => {
			setTimeout(resolve)
		}).then(result => {
			expect(sheath.separator.bind(null, '>')).toThrowError(/config phase/i)
		})
	})
})
