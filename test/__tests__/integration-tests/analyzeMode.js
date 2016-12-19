'use strict'

const sheath = require('../../../src/sheath')



describe('analyzeMode enables advanced analysis tools', () => {
	sheath.mode('analyze')

	it('never calls the definition function', () => {
		return new Promise(resolve => {
			sheath('module1', () => {
				resolve('called')
			})
			setTimeout(() => {
				setTimeout(() => {
					setTimeout(() => {
						resolve('not called')
					})
				})
			})
		}).then(result => {
			expect(result).toBe('not called')
		})
	})
})
