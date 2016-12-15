'use strict'

const sheath = require('../../../src/sheath')
const proto = Object.getPrototypeOf



describe('sheath.object()', () => {
	it('cannot be called during the config phase', () => {
		expect(sheath.object.bind(null, {})).toThrowError(/config phase/i)
	})
	
	it('asserts that the object is an object', () => {
		return new Promise((resolve) => {
			sheath.run(resolve)
		}).then((result) => {
			expect(sheath.object.bind(null, 'the-object')).toThrowError(/must be an object/i)
		})
	})
	
	it('creates an empty object if neither parent nor object is specified', () => {
		return new Promise((resolve) => {
			sheath.run(resolve)
		}).then((result) => {
			let object = sheath.object()
			expect(typeof object).toBe('object')
		})
	})
	
	it('returns a deep copy of the object', () => {
		return new Promise((resolve) => {
			sheath.run(resolve)
		}).then((result) => {
			let object = {a: 1}
			let sheathObject = sheath.object(object)
			expect(sheathObject).not.toBe(object)
			expect(sheathObject.a).toBe(1)
		})
	})
	
	it('cleans the prototype, by default', () => {
		return new Promise((resolve) => {
			sheath.run(resolve)
		}).then((result) => {
			let object = sheath.object()
			expect(object.toString).toBe(undefined)
			expect(proto(object)).toBe(null)
		})
	})
	
	it('asserts that the parent is an object, if specified', () => {
		return new Promise((resolve) => {
			sheath.run(resolve)
		}).then((result) => {
			expect(sheath.object.bind(null, 'the-parent', {})).toThrowError(/must be an object/i)
		})
	})
	
	it('adds the parent to the prototype chain', () => {
		return new Promise((resolve) => {
			sheath.run(resolve)
		}).then((result) => {
			let parentObj = {a: 1}
			let parent = sheath.object(parentObj)
			let childObj = {b: 2}
			let child = sheath.object(parent, childObj)
			expect(child.b).toBe(2)
			expect(child.a).toBe(1)
			expect(Object.hasOwnProperty.call(child, 'a')).toBe(false)
			expect(Object.hasOwnProperty.call(child, 'b')).toBe(true)
			expect(proto(child)).toBe(parent)
		})
	})
	
	it('allows the child to override a property on the parent', () => {
		return new Promise((resolve) => {
			sheath.run(resolve)
		}).then((result) => {
			let parent = sheath.object({
				func() {return 1},
			})
			let child = sheath.object(parent, {
				func() {return 2},
			})
			expect(child.func()).toBe(2)
		})
	})
	
	it('supports grandchildren, great-grandchildren, etc', () => {
		return new Promise((resolve) => {
			sheath.run(resolve)
		}).then((result) => {
			let one = sheath.object()
			let two = sheath.object(one, {})
			let three = sheath.object(two, {})
			let four = sheath.object(three, {})
			let five = sheath.object(four, {})
			expect(proto(five)).toBe(four)
			expect(proto(proto(five))).toBe(three)
			expect(proto(proto(proto(five)))).toBe(two)
			expect(proto(proto(proto(proto(five))))).toBe(one)
			expect(proto(proto(proto(proto(proto(five)))))).toBe(null)
		})
	})
	
	it('supports polymorphism', () => {
		return new Promise((resolve) => {
			sheath.run(resolve)
		}).then((result) => {
			let parent = sheath.object()
			let a = sheath.object(parent, {a: true})
			let b = sheath.object(parent, {b: true})
			let c = sheath.object(parent, {c: true})
			expect(proto(a)).toBe(parent)
			expect(a.a).toBe(true)
			expect(a.b).toBe(undefined)
			expect(proto(b)).toBe(parent)
			expect(b.b).toBe(true)
			expect(b.c).toBe(undefined)
			expect(proto(c)).toBe(parent)
			expect(c.c).toBe(true)
			expect(c.a).toBe(undefined)
		})
	})
})
