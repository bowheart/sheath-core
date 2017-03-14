'use strict'

const sheath = require('../../../src/sheath')



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
	
	it('creates a modifier whose api lives in the sheath namespace under the name of the mod', () => {
		sheath.registerMod('mod1', () => ({api: 'the-api'}))
		expect(sheath.mod1).toBe('the-api')
	})
	
	it('passes a loader to the mod factory', () => {
		let loader
		sheath.registerMod('mod2', load => {
			loader = load
			return {api: 'the-api'}
		})
		expect(typeof loader).toBe('function')
	})
	
	it('asserts that a fileName passed to the loader is a string', () => {
		let loader
		sheath.registerMod('mod3', load => {
			loader = load
			return {api: 'the-api'}
		})
		expect(loader.bind(null, [])).toThrowError(/file name must be a string/i)
	})
	
	it('asserts that an onload callback passed to the loader is a function', () => {
		let loader
		sheath.registerMod('mod4', load => {
			loader = load
			return {api: 'the-api'}
		})
		expect(loader.bind(null, 'some-file', [])).toThrowError(/callback must be a function/i)
	})
	
	it('loads and executes a .js file through the loader', () => {
		return new Promise(resolve => {
			sheath.registerMod('mod5', load => {
				load('test/async-module.js', resolve)
				return {api: 'the-api'}
			})
		}).then(result => {
			expect(sheath.forest('test/async-module')).toHaveLength(1)
		})
	})
	
	it('loads a text file through the loader, returning its contents', () => {
		return new Promise(resolve => {
			sheath.registerMod('mod6', load => {
				load('test/text-file.txt', resolve)
				return {api: 'the-api'}
			})
		}).then(result => {
			expect(result.trim()).toBe('with text in it')
		})
	})
})
