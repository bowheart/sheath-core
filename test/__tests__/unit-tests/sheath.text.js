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
	
	it('provides a handler for text! modules', () => {
		return new Promise(resolve => {
			sheath('module1', 'text!test/text-file.txt', resolve)
		}).then(result => {
			expect(result.trim()).toBe('with text in it')
		})
	})
	
	it('saves loaded text modules and injects them immediately (synchronously)', () => {
		return new Promise(resolve => {
			let str = 'one'
			sheath('module2', 'text!test/text-file.txt', () => str += 'two')
			resolve(str)
		}).then(result => {
			expect(result).toBe('onetwo')
		})
	})
	
	it('queues up all requests for the same text module and resolves them all when it loads', () => {
		return new Promise(resolve => {
			let str = ''
			sheath.run('text!test/text-file2.txt', () => {
				str += 'one'
				setTimeout(() => resolve(str))
			})
			sheath.run('text!test/text-file2.txt', () => str += 'two')
			sheath.run('text!test/text-file2.txt', () => str += 'three')
		}).then(result => {
			expect(result.trim()).toBe('onetwothree')
		})
	})
})
