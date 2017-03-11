'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.config.asyncResolver()', () => {
	it('by default, just tacks on the .js extension', () => {
		let resolver = sheath.config.asyncResolver()
		expect(resolver('test')).toBe('test.js')
	})
	
	it('can be modified during the config phase', () => {
		sheath.config.asyncResolver(module => module.replace('.', '/') + '.js')
		let resolver = sheath.config.asyncResolver()
		expect(resolver('module.submodule')).toBe('module/submodule.js')
	})
	
	it('cannot be modified after the config phase', () => {
		return new Promise(resolve => {
			setTimeout(resolve)
		}).then(result => {
			expect(sheath.config.asyncResolver.bind(null, module => 'js/' + module)).toThrowError(/config phase/i)
		})
	})
})
