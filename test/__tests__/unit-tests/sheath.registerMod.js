'use strict'

const sheath = require('../../../src/sheath')
const testMod = {api: 'the-api', handle: () => {}}



describe('sheath.registerMod()', () => {
	it('asserts that the modifier name is a string', () => {
		expect(sheath.registerMod.bind(null, {})).toThrowError(/mod name must be a string/i)
	})
	
	it('asserts that the modifier name does not conflict with anything else in the sheath namespace', () => {
		expect(sheath.registerMod.bind(null, 'config', () => {})).toThrowError(/exists in the sheath namespace/i)
	})
	
	it('asserts that the factory is a function', () => {
		expect(sheath.registerMod.bind(null, 'mod1', {})).toThrowError(/factory must be a function/i)
	})
	
	it('asserts that the factory returns an object', () => {
		expect(sheath.registerMod.bind(null, 'mod1', () => 'invalid')).toThrowError(/factory must return an object/i)
	})
	
	it('asserts that the mod object has an "api" property', () => {
		expect(sheath.registerMod.bind(null, 'mod1', () => ({}))).toThrowError(/must have an api property/i)
	})
	
	it('asserts that the mod object has a(n) "handle" function', () => {
		expect(sheath.registerMod.bind(null, 'mod1', () => ({api: 'the-api'}))).toThrowError(/must have a.*handle.*function/i)
	})
	
	it('creates a modifier whose api lives in the sheath namespace under the name of the mod', () => {
		sheath.registerMod('mod1', () => (testMod))
		expect(sheath.mod1).toBe('the-api')
	})
	
	it('throws an error if a module attempts to use an unregistered modifier', () => {
		return new Promise(resolve => {
			setTimeout(resolve)
		}).then(result => {
			expect(sheath.bind(null, 'module', 'badmod!badmodule', () => {})).toThrowError(/module.*is requesting an unregistered modifier/i)
		})
	})
})
