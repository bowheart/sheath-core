'use strict'

const sheath = require('../../../src/sheath')



describe('devMode enables advanced debugging tools', () => {
	sheath.mode('dev').emulateBrowser(true)
	
	it('logs a warning when an attempt to fetch an undeclared module asynchronously fails', () => {
		return new Promise(resolve => {
			let mockScript = {}
			document.createElement = () => mockScript
			
			sheath('module1', 'nonexistent-module', () => {})
			setTimeout(() => {
				setTimeout(() => { // timeout again to get past the start of the async phase
					console.warn = warning => resolve(warning)
					mockScript.onerror() // trigger the onerror event handler that Sheath put on our mock script
				})
			})
		}).then(result => {
			expect(result).toMatch(/attempt to.*load.*failed/i)
		})
	})
	
	it('logs a warning when a lazy-loaded file does not contain the desired module', () => {
		return new Promise(resolve => {
			let mockScript = {}
			document.createElement = () => mockScript
			
			sheath('module2', 'nonexistent-module', () => {})
			setTimeout(() => {
				setTimeout(() => { // timeout again to get past the start of the async phase
					let theWarning = ''
					console.warn = jest.fn(warning => {theWarning = warning})
					
					mockScript.onload() // trigger the onerror event handler that Sheath put on our mock script
					sheath('nonexistent-module', () => {})
					mockScript.onload() // shouldn't log another warning
					resolve(theWarning)
				})
			})
		}).then(result => {
			expect(console.warn).toHaveBeenCalledTimes(1)
			expect(result).toMatch(/loaded.*but module.*not found/i)
		})
	})
	
	it('logs a warning when a script tag exists, but its related module does not', () => {
		return new Promise(resolve => {
			Object.defineProperty(document, 'scripts', {
				value: [{
					getAttribute: jest.fn(() => 'nonexistent-module2.js')
				}]
			})
			setTimeout(() => {
				console.warn = warning => resolve(warning)
				sheath('module3', 'nonexistent-module2', () => {})
			})
		}).then(result => {
			expect(document.scripts[0].getAttribute).toHaveBeenCalledWith('src')
			expect(result).toMatch(/file.*already loaded.*no declaration found/i)
		})
	})
})
