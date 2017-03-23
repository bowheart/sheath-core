'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.store()', () => {
	it('asserts that the first param is an array', () => {
		expect(sheath.store.bind(null, 'param')).toThrowError(/must be an array/i)
	})
	
	it('asserts that the second param is an object, if given', () => {
		expect(sheath.store.bind(null, [], 'param2')).toThrowError(/must be an object/i)
	})
	
	it('returns an object with all common non-mutating Array.prototype properties', () => {
		let store = sheath.store([])
		let nonMutating = ['every', 'filter', 'forEach', 'indexOf', 'join', 'lastIndexOf', 'map', 'reduce', 'reduceRight', 'slice', 'some']
		for (let i = 0; i < nonMutating.length; i++) {
			expect(typeof store[nonMutating[i]]).toBe('function')
		}
	})
	
	it('binds all native accessor properties to the array', () => {
		let store = sheath.store([1])
		expect(store.map(val => val)[0]).toBe(1)
	})
	
	it('exposes a length getter', () => {
		let store = sheath.store([1])
		expect(store.length).toBe(1)
	})
	
	it('complies with the es6 iterable spec', () => {
		let store = sheath.store(['one', 'two'])
		expect([...store][0]).toBe('one')
		let values = []
		for (let i of store) {
			values.push(i)
		}
		expect(values).toHaveLength(2)
		expect(values[1]).toBe('two')
	})
	
	it('adds the specified properties to the store', () => {
		let arr = ['one', 'two']
		let store = sheath.store(arr, {
			add: str => arr.push(str)
		})
		expect(typeof store.add).toBe('function')
		store.add('three')
		expect(store).toHaveLength(3)
		expect(store.map(val => val)[2]).toBe('three')
	})
	
	it('allows the specified properties to override the default store properties', () => {
		let store = sheath.store([], {
			map: 'the map'
		})
		expect(store.map).toBe('the map')
	})
	
	it('does not implement es6 stuff if not available', () => {
		Symbol = 'symbol'
		let store = sheath.store([])
		expect(() => [...store]).toThrowError(/is not a function/i)
	})
})
