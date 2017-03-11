'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.config.baseObject()', () => {
	it('is undefined by default', () => {
		expect(sheath.config.baseObject()).toBe(undefined)
	})
	
	it('asserts that the baseObject is an object', () => {
		expect(sheath.config.baseObject.bind(null, 'the-base-object')).toThrowError(/must be an object or null/i)
	})
	
	it('can be modified during the config phase', () => {
		sheath.config.baseObject({a: 1})
		expect(sheath.config.baseObject().a).toBe(1)
	})
	
	it('can be set to null', () => {
		sheath.config.baseObject(null)
		expect(sheath.config.baseObject()).toBe(null)
	})
	
	it('can be chained', () => {
		sheath.config.baseObject({b: 2}).baseObject({c: 3})
		expect(sheath.config.baseObject().b).toBe(undefined)
		expect(sheath.config.baseObject().c).toBe(3)
	})
	
	it('cannot be modified after the config phase', () => {
		return new Promise(resolve => {
			setTimeout(resolve)
		}).then(result => {
			expect(sheath.config.baseObject.bind(null, {a: 2})).toThrowError(/config phase/i)
		})
	})
})
