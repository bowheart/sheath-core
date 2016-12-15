'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.fragmentAccessor()', () => {
	it('is a "." character by default', () => {
		expect(sheath.fragmentAccessor()).toBe('.')
	})
	
	it('can be modified during the config phase', () => {
		sheath.fragmentAccessor('')
		expect(sheath.fragmentAccessor()).toBe('')
	})
	
	it('must be a string, when specified', () => {
		expect(sheath.fragmentAccessor.bind(null, 33)).toThrowError(/must be a string/i)
	})
	
	it('can be chained', () => {
		sheath.fragmentAccessor('.').fragmentAccessor('::')
		expect(sheath.fragmentAccessor()).toBe('::')
	})
	
	it('cannot be modified after the config phase', () => {
		return new Promise((resolve) => {
			setTimeout(resolve)
		}).then((result) => {
			expect(sheath.fragmentAccessor.bind(null, '>')).toThrowError(/config phase/i)
		})
	})
})
