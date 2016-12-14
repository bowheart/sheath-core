'use strict'

const sheath = require('../../src/sheath')



describe('sheath.baseObject()', () => {
	it('is undefined by default', () => {
		expect(sheath.baseObject()).toBe(undefined)
	})
	
	it('asserts that the baseObject is an object', () => {
		expect(sheath.baseObject.bind(null, 'the-base-object')).toThrowError(/must be an object or null/i)
	})
	
	it('can be modified during the config phase', () => {
		sheath.baseObject({a: 1})
		expect(sheath.baseObject().a).toBe(1)
	})
	
	it('can be set to null', () => {
		sheath.baseObject(null)
		expect(sheath.baseObject()).toBe(null)
	})
	
	it('can be chained', () => {
		sheath.baseObject({b: 2}).baseObject({c: 3})
		expect(sheath.baseObject().b).toBe(undefined)
		expect(sheath.baseObject().c).toBe(3)
	})
	
	it('cannot be modified after the config phase', () => {
		return new Promise((resolve) => {
			setTimeout(resolve)
		}).then((result) => {
			expect(sheath.baseObject.bind(null, {a: 2})).toThrowError(/config phase/i)
		})
	})
})
