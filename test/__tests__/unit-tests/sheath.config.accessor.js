'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.config.accessor()', () => {
	it('is a "." character by default', () => {
		expect(sheath.config.accessor()).toBe('.')
	})
	
	it('can be modified during the config phase', () => {
		sheath.config.accessor('')
		expect(sheath.config.accessor()).toBe('')
	})
	
	it('must be a string, when specified', () => {
		expect(sheath.config.accessor.bind(null, 33)).toThrowError(/must be a string/i)
	})
	
	it('can be chained', () => {
		sheath.config.accessor('.').accessor('::')
		expect(sheath.config.accessor()).toBe('::')
	})
	
	it('cannot be set to the separator', () => {
		expect(sheath.config.accessor.bind(null, sheath.config.separator())).toThrowError(/cannot be the same/i)
	})
	
	it('cannot be modified after the config phase', () => {
		return new Promise(resolve => {
			setTimeout(resolve)
		}).then(result => {
			expect(sheath.config.accessor.bind(null, '>')).toThrowError(/config phase/i)
		})
	})
})
