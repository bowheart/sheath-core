'use strict'

const sheath = require('../../../src/sheath')



describe('devMode enables advanced analysis and debugging tools', () => {
	sheath.devMode(true)
	sheath.emulateBrowser(true)
	
	it('logs a warning when an attempt to fetch an undeclared module asynchronously fails', () => {
		return new Promise(resolve => {
			console.warn = jest.fn()
			let mockScript = {}
			document.createElement = () => mockScript
			
			sheath('module1', 'nonexistent-module', () => {})
			setTimeout(() => {
				setTimeout(() => { // timeout again to get past the start of the async phase
					mockScript.onerror() // trigger the onerror event handler that Sheath put on our mock script
					resolve()
				})
			})
		}).then(result => {
			expect(console.warn).toHaveBeenCalled()
		})
	})
	
	it('logs a warning when a lazy-loaded file does not contain the desired module', () => {
		return new Promise(resolve => {
			console.warn = jest.fn()
			let mockScript = {}
			document.createElement = () => mockScript
			
			sheath('module2', 'nonexistent-module', () => {})
			setTimeout(() => {
				setTimeout(() => { // timeout again to get past the start of the async phase
					mockScript.onload() // trigger the onerror event handler that Sheath put on our mock script
					sheath('nonexistent-module', () => {})
					mockScript.onload() // shouldn't log another warning
					resolve()
				})
			})
		}).then(result => {
			expect(console.warn).toHaveBeenCalledTimes(1)
		})
	})
	
	it('logs a warning when a script tag exists, but its related module does not', () => {
		return new Promise(resolve => {
			document.scripts = [{
				getAttribute: jest.fn(() => 'nonexistent-module2.js')
			}]
			setTimeout(() => {
				console.warn = (warning) => {
					resolve(warning)
				}
				sheath('module3', 'nonexistent-module2', () => {})
			})
		}).then(result => {
			expect(document.scripts[0].getAttribute).toHaveBeenCalledWith('src')
			expect(result).toMatch(/file.*already loaded.*no declaration found/i)
		})
	})
})
