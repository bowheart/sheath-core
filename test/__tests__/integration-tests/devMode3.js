'use strict'

const sheath = require('../../../src/sheath')



describe('devMode enables even more advanced debugging tools', () => {
	sheath.mode('dev')
	
	it('logs a warning if the global property of a lib does not exist', () => {
		return new Promise(resolve => {
			console.warn = warning => resolve(warning)
			sheath.lib('nonexistentLib')
		}).then(result => {
			expect(result).toMatch(/property.*not found/i)
		})
	})
	
	it('logs a warning if an attempt to load a module server-side fails', () => {
		return new Promise(resolve => {
			console.warn = warning => resolve(warning)
			sheath('module1', 'nonexistent-module', () => {})
		}).then(result => {
			expect(result).toMatch(/failed to find module.*on the server/i)
		})
	})
})
