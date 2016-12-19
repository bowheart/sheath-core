'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.mode()', () => {
	it('is set to "production" by default', () => {
		expect(sheath.mode()).toBe('production')
	})

	it('can be set to "dev" during the config phase', () => {
		sheath.mode('dev')
		expect(sheath.mode()).toBe('dev')
	})

	it('can be set to "analyze" during the config phase', () => {
		sheath.mode('analyze')
		expect(sheath.mode()).toBe('analyze')
	})

	it('can be set to "production" during the config phase', () => {
		sheath.mode('production')
		expect(sheath.mode()).toBe('production')
	})

	it('asserts that the passed value is one of ["production", "dev", "analyze"]', () => {
		expect(sheath.mode.bind(null, 'other')).toThrowError(/not a valid mode/i)
	})

	it('cannot be modified after the config phase', () => {
		return new Promise(resolve => {
			setTimeout(resolve)
		}).then(result => {
			expect(sheath.mode.bind(null, false)).toThrowError(/config phase/i)
		})
	})
})
