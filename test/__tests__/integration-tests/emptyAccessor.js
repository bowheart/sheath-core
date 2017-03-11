'use strict'

const sheath = require('../../../src/sheath')



describe('disabled accessor', () => {
	sheath.config.accessor('')
	
	it('allows a module name to contain anything (except a "." as the first character)', () => {
		expect(sheath.bind(null, 'module.name', () => {})).not.toThrow()
	})
	
	it('does not look for fragments', () => {
		return new Promise(resolve => {
			sheath('module1', 'module.sans.fragments', resolve)
			sheath('module.sans.fragments', () => 'visage1')
		}).then(result => {
			expect(result).toBe('visage1')
		})
	})
})
