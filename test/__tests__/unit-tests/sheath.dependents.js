'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.dependents()', () => {
	it('finds a dependent of a module', () => {
		return new Promise((resolve) => {
			sheath('dependent', 'dependency', () => {})
			sheath('dependency', () => {})
			sheath.run(resolve)
		}).then((result) => {
			expect(sheath.dependents().dependency).toContain('dependent')
		})
	})
	
	it('finds all dependents of a module', () => {
		return new Promise((resolve) => {
			sheath('dependent2', 'dependency', () => {})
			sheath.run(resolve)
		}).then((result) => {
			let dependency = sheath.dependents().dependency
			expect(dependency).toContain('dependent')
			expect(dependency).toContain('dependent2')
			expect(dependency).toHaveLength(2)
		})
	})
	
	it('finds all dependents of all modules', () => {
		return new Promise((resolve) => {
			sheath('dependent3', 'dependent2', () => {})
			sheath.run(resolve)
		}).then((result) => {
			let dependents = sheath.dependents()
			expect(dependents.dependent2).toContain('dependent3')
			expect(dependents.dependent2).toHaveLength(1)
			expect(dependents.dependency).toContain('dependent')
			expect(dependents.dependency).toContain('dependent2')
			expect(dependents.dependency).toHaveLength(2)
		})
	})
})
