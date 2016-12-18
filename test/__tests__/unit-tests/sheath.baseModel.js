'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.baseModel()', () => {
	it('is undefined by default', () => {
		expect(sheath.baseModel()).toBe(undefined)
	})
	
	it('asserts that the baseModel is an object', () => {
		expect(sheath.baseModel.bind(null, 'the-base-model')).toThrowError(/must be an object or null/i)
	})
	
	it('can be modified during the config phase', () => {
		let baseModel = {a: 1}
		sheath.baseModel(baseModel)
		let setModel = sheath.baseModel()
		expect(new setModel().a).toBe(1)
	})
	
	it('can be set to null', () => {
		sheath.baseModel(null)
		expect(sheath.baseModel()).toBe(null)
	})
	
	it('can be chained', () => {
		sheath.baseModel({b: 2}).baseModel({c: 3})
		let setModel = sheath.baseModel()
		let instance = new setModel()
		expect(instance.b).toBe(undefined)
		expect(instance.c).toBe(3)
	})
	
	it('cannot be modified after the config phase', () => {
		return new Promise(resolve => {
			setTimeout(resolve)
		}).then(result => {
			expect(sheath.baseModel.bind(null, {a: 2})).toThrowError(/config phase/i)
		})
	})
})
