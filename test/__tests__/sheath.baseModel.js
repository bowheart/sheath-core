'use strict'

const sheath = require('../../src/sheath')



describe('sheath.baseModel()', () => {
	it('is undefined by default', () => {
		expect(sheath.baseModel()).toBe(undefined)
	})
	
	it('can be modified during the config phase', () => {
		let baseModel = {a: 1}
		sheath.baseModel(baseModel)
		let setModel = sheath.baseModel()
		expect(new setModel().a).toBe(1)
	})
	
	it('cannot be modified after the config phase', () => {
		return new Promise((resolve) => {
			setTimeout(resolve)
		}).then((result) => {
			expect(sheath.baseModel.bind(null, {a: 2})).toThrowError(/config phase/i)
		})
	})
})
