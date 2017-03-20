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
		expect(sheath.config('async')).toBe(true)
	})
	
	it('sets a single value', () => {
		sheath.config('async', false)
		expect(sheath.config('async')).toBe(false)
	})
	
	it('asserts that all keys in an object are valid config settings', () => {
		expect(sheath.config.bind(null, {async: true, thing: 'val'})).toThrowError(/invalid config setting.*thing/i)
	})
	
	it('sets multiple values when an object is passed', () => {
		sheath.config({async: true, emulateBrowser: true})
		expect(sheath.config('async')).toBe(true)
		expect(sheath.config('emulateBrowser')).toBe(true)
	})
	
	it('can be chained', () => {
		sheath.config('async', false)('emulateBrowser', true)
		expect(sheath.config('async')).toBe(false)
		expect(sheath.config('emulateBrowser')).toBe(true)
	})
})
