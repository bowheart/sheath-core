'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.load()', () => {
	it('asserts that the fileName is a string', () => {
		expect(sheath.load.bind(null, [])).toThrowError(/file name must be a string/i)
	})
	
	it('asserts that the onload callback is a function', () => {
		expect(sheath.load.bind(null, 'some-file', [])).toThrowError(/callback must be a function/i)
	})
	
	it('loads and executes a .js file', () => {
		return new Promise(resolve => {
			sheath.load('test/async-module.js', resolve)
		}).then(result => {
			expect(sheath.forest('test/async-module')).toHaveLength(1)
		})
	})
	
	it('loads a text file, returning its contents', () => {
		return new Promise(resolve => {
			sheath.load('test/text-file.txt', (err, content) => resolve(content))
		}).then(result => {
			expect(result.trim()).toBe('with text in it')
		})
	})
	
	it('saves the contents of all requested files--never requesting the same file twice', () => {
		return new Promise(resolve => {
			sheath.load('test/text-file.txt', (err, content) => resolve(content))
		}).then(result => {
			expect(result.trim()).toBe('with text in it')
		})
	})
})
