'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.missing()', () => {
	it('returns an empty array when there are no missing modules', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			sheath('module1', () => {})
			expect(sheath.missing()).toHaveLength(0)
		})
	})
	
	it('returns the name of a missing module and lists all its dependents', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			sheath('module2', 'missing-module', () => {})
			sheath('module3', 'missing-module', () => {})
			let missing = sheath.missing()
			expect(missing).toHaveLength(1)
			expect(missing[0].name).toBe('missing-module')
			expect(missing[0].dependents).toHaveLength(2)
			expect(missing[0].dependents).toContain('module2')
			expect(missing[0].dependents).toContain('module3')
		})
	})
	
	it('returns all missing modules', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			sheath('module4', ['missing-module2', 'missing-module3'], () => {})
			sheath('module5', 'missing-module4', () => {})
			let missing = sheath.missing()
			expect(missing).toHaveLength(4)
		})
	})
})
