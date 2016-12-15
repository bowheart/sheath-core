'use strict'

const sheath = require('../../../src/sheath')



describe('sheath.phase()', () => {
	it('returns "config" during the config phase', () => {
		expect(sheath.phase()).toBe('config')
	})
	
	it('returns "sync" during the sync phase', () => {
		return new Promise((resolve) => {
			sheath.run(() => {
				resolve(sheath.phase())
			})
		}).then((result) => {
			expect(result).toBe('sync')
			expect(sheath.phase()).toBe('sync')
		})
	})
	
	it('returns "async" during the async phase', () => {
		return new Promise((resolve) => {
			setTimeout(resolve)
		}).then((result) => {
			expect(sheath.phase()).toBe('async')
		})
	})
})
