'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.accessor()', () => {
	it('is a "." character by default', () => {
		expect(sheath.accessor()).toBe('.')
	})
	
	it('can be modified during the config phase', () => {
		sheath.accessor('')
		expect(sheath.accessor()).toBe('')
	})
	
	it('must be a string, when specified', () => {
		expect(sheath.accessor.bind(null, 33)).toThrowError(/must be a string/i)
	})
	
	it('can be chained', () => {
		sheath.accessor('.').accessor('::')
		expect(sheath.accessor()).toBe('::')
	})
	
	it('cannot be set to the separator', () => {
		expect(sheath.accessor.bind(null, sheath.separator())).toThrowError(/cannot be the same/i)
	})
	
	it('cannot be modified after the config phase', () => {
		return new Promise(resolve => {
			setTimeout(resolve)
		}).then(result => {
			expect(sheath.accessor.bind(null, '>')).toThrowError(/config phase/i)
		})
	})
})
