'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.instance()', () => {
	it('cannot be called during the config phase', () => {
		expect(sheath.instance.bind(null, {})).toThrowError(/sheath\.instance.*config phase/i)
	})

	it('asserts that the model is an object', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			expect(sheath.instance.bind(null, '')).toThrowError(/sheath\.instance.*must be an object/i)
		})
	})

	it('asserts that the "init" property is a function, if specified', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			expect(sheath.instance.bind(null, {init: 'init'})).toThrowError(/sheath\.instance.*init.*a function/i)
		})
	})

	it('asserts that the parent is a function, if specified', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			expect(sheath.instance.bind(null, 'the-parent', {})).toThrowError(/sheath\.instance.*must be a .*function/i)
		})
	})
	
	it('returns an instance of a model', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			let instance = sheath.instance({a: 1})
			expect(instance.a).toBe(1)
		})
	})
	
	it('sets the parent of the model whose instance it returns', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			let Parent = sheath.model({a: 1, b: 2})
			let instance = sheath.instance(Parent, {b: 3})
			expect(instance.a).toBe(1)
			expect(instance.b).toBe(3)
		})
	})
	
	it('respects the init method, e.g. allowing mutatable properties to be set there', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			let Parent = sheath.model({
				init() {this.a = [1, 3, 5]}
			})
			let instance1 = sheath.instance(Parent, {a: 2})
			let instance2 = sheath.instance(Parent, {})
			instance1.a.push(44)
			expect(instance1.a).toHaveLength(4)
			expect(instance2.a).toHaveLength(3)
		})
	})
})
