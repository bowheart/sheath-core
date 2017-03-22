'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.forest()', () => {
	it('finds an app-level module and a dependency', () => {
		return new Promise(resolve => {
			sheath('app1', 'dependency1', resolve)
			sheath('dependency1', () => {})
		}).then(result => {
			let forest = sheath.forest()
			expect(Object.keys(forest)).toHaveLength(1)
			expect(forest.app1).toHaveLength(2)
			expect(forest.app1).toContain('dependency1')
			expect(forest.app1).toContain('app1')
		})
	})
	
	it('finds multiple apps and dependencies', () => {
		return new Promise(resolve => {
			sheath('app2', ['dependency2', 'dependency3'], resolve)
			sheath('dependency2', () => {})
			sheath('dependency3', () => {})
		}).then(result => {
			let forest = sheath.forest()
			expect(Object.keys(forest)).toHaveLength(2)
			expect(forest.app2).toHaveLength(3)
			expect(forest.app2).toContain('dependency2')
			expect(forest.app2).toContain('dependency3')
			expect(forest.app2).toContain('app2')
		})
	})
	
	it('finds nested dependencies', () => {
		return new Promise(resolve => {
			sheath('app3', 'dependency4', resolve)
			sheath('dependency4', '/a', () => {})
			sheath('dependency4/a', './b', () => {})
			sheath('dependency4/b', () => {})
		}).then(result => {
			let forest = sheath.forest()
			expect(forest.app3).toHaveLength(4)
			expect(forest.app3).toContain('dependency4/b')
			expect(forest.app3).toContain('dependency4/a')
			expect(forest.app3).toContain('dependency4')
			expect(forest.app3).toContain('app3')
		})
	})
	
	it('lists each tree in its optimal load-order', () => {
		let forest = sheath.forest()
		expect(forest.app1[0]).toBe('dependency1')
		expect(forest.app1[1]).toBe('app1')
		expect(forest.app2[0]).toMatch(/dependency/)
		expect(forest.app2[1]).toMatch(/dependency/)
		expect(forest.app2[2]).toBe('app2')
		expect(forest.app3[0]).toBe('dependency4/b')
		expect(forest.app3[1]).toBe('dependency4/a')
		expect(forest.app3[2]).toBe('dependency4')
		expect(forest.app3[3]).toBe('app3')
	})
	
	it('finds the load-order-optimized tree of a given module', () => {
		let tree = sheath.forest('dependency4')
		expect(tree[0]).toBe('dependency4/b')
		expect(tree[1]).toBe('dependency4/a')
		expect(tree[2]).toBe('dependency4')
	})
	
	it('returns an empty array if the given module does not exist', () => {
		let tree = sheath.forest('nonexistent-module')
		expect(tree).toHaveLength(0)
	})
})
