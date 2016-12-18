'use strict'

const sheath = require('../../../src/sheath')



describe('Sheath fragments', () => {
	it('can access a property on a visage object of a module', () => {
		return new Promise(resolve => {
			sheath('module1', () => ({a: 1}))
			sheath('module2', 'module1.a', a => {
				resolve(a)
				return {a: {b: {c: 3}}}
			})
		}).then(result => {
			expect(result).toBe(1)
		})
	})
	
	it('can access nested properties on a visage object of a module', () => {
		return new Promise(resolve => {
			sheath('module3', 'module2.a.b.c', c => {
				resolve(c)
				sheath.export('a', 1)
			})
		}).then(result => {
			expect(result).toBe(3)
		})
	})
	
	it('can access a property on an export of a module', () => {
		return new Promise(resolve => {
			sheath('module4', 'module3.a', a => {
				resolve(a)
				sheath.export('a', {b: {c: 3}})
			})
		}).then(result => {
			expect(result).toBe(1)
		})
	})
	
	it('can access nested properties on an export of a module', () => {
		return new Promise(resolve => {
			sheath('module5', 'module4.a.b.c', resolve)
		}).then(result => {
			expect(result).toBe(3)
		})
	})
	
	it('returns undefined if the fragment is not found on the given module', () => {
		return new Promise(resolve => {
			sheath('module6', 'module5.a', resolve)
		}).then(result => {
			expect(result).toBe(undefined)
		})
	})
	
	it('returns undefined if the parent of a nested fragment is not found on the given module', () => {
		return new Promise(resolve => {
			sheath('module7', 'module6.a.b.c', c => {
				resolve(c)
				sheath.export('a', 1)
				return {a: 2}
			})
		}).then(result => {
			expect(result).toBe(undefined)
		})
	})
	
	it('gives the export precedence if the same property exists as an export and on the visage', () => {
		return new Promise(resolve => {
			sheath('module8', 'module7.a', a => {
				resolve(a)
				sheath.export('a', 1)
				return {b: 2}
			})
		}).then(result => {
			expect(result).toBe(1)
		})
	})
	
	it('does not expose exports as part of the visage', () => {
		return new Promise(resolve => {
			sheath('module9', 'module8', resolve)
		}).then(result => {
			expect(result.b).toBe(2)
			expect(result.a).toBe(undefined)
		})
	})
})
