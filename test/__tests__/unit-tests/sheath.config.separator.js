'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.config.separator()', () => {
	it('is a "/" character by default', () => {
		expect(sheath.config.separator()).toBe('/')
	})
	
	it('can be modified during the config phase', () => {
		sheath.config.separator('')
		expect(sheath.config.separator()).toBe('')
	})
	
	it('must be a string, when specified', () => {
		expect(sheath.config.separator.bind(null, 33)).toThrowError(/must be a string/i)
	})
	
	it('can be chained', () => {
		sheath.config.separator('>').separator('::')
		expect(sheath.config.separator()).toBe('::')
	})
	
	it('cannot be set to the accessor', () => {
		expect(sheath.config.separator.bind(null, sheath.config.accessor())).toThrowError(/cannot be the same/i)
	})
	
	it('cannot be modified after the config phase', () => {
		return new Promise(resolve => {
			setTimeout(resolve)
		}).then(result => {
			expect(sheath.config.separator.bind(null, '>')).toThrowError(/config phase/i)
		})
	})
})
