'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.text()', () => {
	it('asserts that the text module name is a string', () => {
		expect(sheath.text.bind(null, {})).toThrowError(/name must be a string/i)
	})
	
	it('creates a text module with the given content', () => {
		sheath.text('text-module', 'some text')
		expect(sheath.text('text-module')).toBe('some text')
	})
	
	it('cannot declare the same text module twice', () => {
		expect(sheath.text.bind(null, 'text-module', 'other text')).toThrowError(/a text module with name.*exists/i)
	})
})
