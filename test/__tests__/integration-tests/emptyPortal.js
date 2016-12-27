'use strict'

const sheath = require('../../../src/sheath')



describe('disabled portal', () => {
	sheath.portal('')
	
	it('does not look for fragments', () => {
		return new Promise(resolve => {
			sheath('module1', 'module.sans.fragments', resolve)
			sheath('module.sans.fragments', () => 'visage1')
		}).then(result => {
			expect(result).toBe('visage1')
		})
	})
	
	it('does not append submodule names to the name of the current module', () => {
		return new Promise(resolve => {
			sheath('module2', './non-submodule', resolve)
			sheath('./non-submodule', () => 'visage2')
		}).then(result => {
			expect(result).toBe('visage2')
		})
	})
})
