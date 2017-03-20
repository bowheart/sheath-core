'use strict'

const sheath = require('../../../src/sheath')



describe('client-side loading is exceptional', () => {
	sheath.config.mode('dev').emulateBrowser(true)
	
	it('loads a text file', () => {
		return new Promise(resolve => {
			let result = ''
			class Req {
				open(method, fileName, sync) {
					result += method + fileName + sync
				}
				send() {
					// Call the handler Sheath put on here with a fake xhr.
					this.onload({
						target: {
							status: 200,
							response: 'the response'
						}
					})
				}
			}
			
			Object.defineProperty(window, 'XMLHttpRequest', {
				value: Req
			})
			
			sheath.load('test/text-file.txt', (err, content) => resolve(result + content))
		}).then(result => {
			expect(result.trim()).toBe('GETtest/text-file.txttruethe response')
		})
	})
})
