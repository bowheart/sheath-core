'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.config.baseModel()', () => {
	it('is undefined by default', () => {
		expect(sheath.config.baseModel()).toBe(undefined)
	})
	
	it('asserts that the baseModel is an object', () => {
		expect(sheath.config.baseModel.bind(null, 'the-base-model')).toThrowError(/must be an object or null/i)
	})
	
	it('can be modified during the config phase', () => {
		let baseModel = {a: 1}
		sheath.config.baseModel(baseModel)
		let setModel = sheath.config.baseModel()
		expect(new setModel().a).toBe(1)
	})
	
	it('can be set to null', () => {
		sheath.config.baseModel(null)
		expect(sheath.config.baseModel()).toBe(null)
	})
	
	it('can be chained', () => {
		sheath.config.baseModel({b: 2}).baseModel({c: 3})
		let setModel = sheath.config.baseModel()
		let instance = new setModel()
		expect(instance.b).toBe(undefined)
		expect(instance.c).toBe(3)
	})
	
	it('cannot be modified after the config phase', () => {
		return new Promise(resolve => {
			setTimeout(resolve)
		}).then(result => {
			expect(sheath.config.baseModel.bind(null, {a: 2})).toThrowError(/config phase/i)
		})
	})
})
