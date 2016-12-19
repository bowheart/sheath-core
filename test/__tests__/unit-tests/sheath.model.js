'use strict'

const sheath = require('../../../src/sheath')
const proto = Object.getPrototypeOf



describe('sheath.model()', () => {
	it('cannot be called during the config phase', () => {
		expect(sheath.model.bind(null, {})).toThrowError(/config phase/i)
	})

	it('asserts that the model is an object', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			expect(sheath.model.bind(null, '')).toThrowError(/expects.*an object/i)
		})
	})

	it('creates a JavaScript "class" constructor', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			let Model = sheath.model({a: 1})
			expect(typeof Model).toBe('function')
			expect(new Model().a).toBe(1)
		})
	})

	it('asserts that the "init" property is a function, if specified', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			expect(sheath.model.bind(null, {init: 'init'})).toThrowError(/must be a function/i)
		})
	})

	it('makes the "init" property the constructor, if specified', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			let Model = sheath.model({
				init: function() { this.a = 1 }
			})
			expect(new Model().a).toBe(1)
		})
	})

	it('cleans the prototype, by default', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			let Model = sheath.model({})
			expect(new Model().toString).toBe(undefined)
		})
	})

	it('sets the super property to null when there is no parent', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			let Model = sheath.model({})
			expect(new Model().super).toBe(null)
		})
	})

	it('asserts that the parent is a function, if specified', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			expect(sheath.model.bind(null, 'the-parent', {})).toThrowError(/expects.* a .*function/i)
		})
	})

	it('adds the prototype of the parent function to the prototype chain', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			let Parent = sheath.model({})
			let Child = sheath.model(Parent, {})
			let child = new Child()
			expect(child instanceof Child).toBe(true)
			expect(child instanceof Parent).toBe(true)
			expect(proto(child)).toBe(Child.prototype)
			expect(proto(proto(child))).toBe(Parent.prototype)
		})
	})

	it('sets the super property to the parent', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			let Parent = sheath.model({})
			let Child = sheath.model(Parent, {})
			let child = new Child()
			expect(child.super).toBe(Parent.prototype)
		})
	})

	it('allows the child to override a property on the parent', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			let Parent = sheath.model({
				func() {return 1},
				func2() { return 3}
			})
			let Child = sheath.model(Parent, {
				func() {return 2},
				func2() {return this.super.func2() + 4}
			})
			let child = new Child()
			expect(child.func()).toBe(2)
			expect(child.func2()).toBe(7)
		})
	})

	it('supports grandchildren, great-grandchildren, etc', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			let One = sheath.model({})
			let Two = sheath.model(One, {})
			let Three = sheath.model(Two, {})
			let Four = sheath.model(Three, {})
			let Five = sheath.model(Four, {})
			let five = new Five()
			expect(five.super).toBe(Four.prototype)
			expect(five.super.super).toBe(Three.prototype)
			expect(five.super.super.super).toBe(Two.prototype)
			expect(five.super.super.super.super).toBe(One.prototype)
			expect(five.super.super.super.super.super).toBe(null)
		})
	})

	it('supports polymorphism', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			let Parent = sheath.model({})
			let A = sheath.model(Parent, {})
			let B = sheath.model(Parent, {})
			let C = sheath.model(Parent, {})
			let a = new A()
			let b = new B()
			let c = new C()
			expect(a instanceof A).toBe(true)
			expect(a instanceof Parent).toBe(true)
			expect(a instanceof B).toBe(false)
			expect(b instanceof B).toBe(true)
			expect(b instanceof Parent).toBe(true)
			expect(b instanceof C).toBe(false)
			expect(c instanceof C).toBe(true)
			expect(c instanceof Parent).toBe(true)
			expect(c instanceof A).toBe(false)
		})
	})
})
