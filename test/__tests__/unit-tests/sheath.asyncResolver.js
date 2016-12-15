'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.asyncResolver()', () => {
	it('by default, just tacks on the .js extension', () => {
		let resolver = sheath.asyncResolver()
		expect(resolver('test')).toBe('test.js')
	})
	
	it('can be modified during the config phase', () => {
		sheath.asyncResolver(module => module.replace('.', '/') + '.js')
		let resolver = sheath.asyncResolver()
		expect(resolver('module.submodule')).toBe('module/submodule.js')
	})
	
	it('cannot be modified after the config phase', () => {
		return new Promise((resolve) => {
			setTimeout(resolve)
		}).then((result) => {
			expect(sheath.asyncResolver.bind(null, module => 'js/' + module)).toThrowError(/config phase/i)
		})
	})
})
