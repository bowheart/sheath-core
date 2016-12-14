'use strict'

const sheath = require('../../src/sheath')



describe('sheath.export()', () => {
	it('logs a warning when called outside a module definition', () => {
		console.warn = jest.fn()
		sheath.export('key1', 'val1').export('key2', 'val2')
		expect(console.warn).toHaveBeenCalledTimes(2)
	})
	
	it('exports a fragment on the current module', () => {
		return new Promise((resolve) => {
			sheath('module1', () => {
				sheath.export('export1', 'val1')
				resolve(sheath.export('export1'))
				return 'visage1'
			})
		}).then((result) => {
			expect(result).toBe('val1')
		})
	})
	
	it('can be chained', () => {
		return new Promise((resolve) => {
			sheath('module2', () => {
				sheath.export('export1', 'val1').export('export2', 'val2')
				resolve(sheath.export('export1') + sheath.export('export2'))
			})
		}).then((result) => {
			expect(result).toBe('val1val2')
		})
	})
	
	it('can be invoked by the module definition, but live outside it', () => {
		return new Promise((resolve) => {
			sheath('module3', 'exporter', (exporter) => {
				exporter()
				resolve(sheath.export('export1'))
			})
			sheath('exporter', () => () => {
				sheath.export('export1', 'val1')
			})
		}).then((result) => {
			expect(result).toBe('val1')
		})
	})
})
