'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.config.mode()', () => {
	it('is set to "production" by default', () => {
		expect(sheath.config.mode()).toBe('production')
	})

	it('can be set to "dev" during the config phase', () => {
		sheath.config.mode('dev')
		expect(sheath.config.mode()).toBe('dev')
	})

	it('can be set to "analyze" during the config phase', () => {
		sheath.config.mode('analyze')
		expect(sheath.config.mode()).toBe('analyze')
	})

	it('can be set to "production" during the config phase', () => {
		sheath.config.mode('production')
		expect(sheath.config.mode()).toBe('production')
	})

	it('asserts that the passed value is one of ["production", "dev", "analyze"]', () => {
		expect(sheath.config.mode.bind(null, 'other')).toThrowError(/invalid mode/i)
	})

	it('cannot be modified after the config phase', () => {
		return new Promise(resolve => {
			setTimeout(resolve)
		}).then(result => {
			expect(sheath.config.mode.bind(null, false)).toThrowError(/config phase/i)
		})
	})
})
