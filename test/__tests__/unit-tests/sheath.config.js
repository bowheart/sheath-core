'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.config()', () => {
	it('asserts that the key is either a string or an object', () => {
		expect(sheath.config.bind(null, ['invalid-type'])).toThrowError(/expects.*key.*an object/i)
	})
	
	it('asserts that the key is a valid config setting', () => {
		expect(sheath.config.bind(null, 'thing')).toThrowError(/invalid config setting.*thing/i)
	})
	
	it('gets a single value', () => {
		expect(sheath.config('separator')).toBe('/')
	})
	
	it('sets a single value', () => {
		sheath.config('separator', '>')
		expect(sheath.config('separator')).toBe('>')
	})
	
	it('asserts that all keys in an object are valid config settings', () => {
		expect(sheath.config.bind(null, {separator: ',', thing: 'val'})).toThrowError(/invalid config setting.*thing/i)
	})
	
	it('sets multiple values when an object is passed', () => {
		sheath.config({separator: '^', accessor: '>'})
		expect(sheath.config('separator')).toBe('^')
		expect(sheath.config('accessor')).toBe('>')
	})
	
	it('can be chained', () => {
		sheath.config('accessor', '!')('async', false)
		expect(sheath.config('accessor')).toBe('!')
		expect(sheath.config('async')).toBe(false)
	})
})
