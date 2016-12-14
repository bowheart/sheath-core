'use strict'

const sheath = require('../../src/sheath')



describe('sheath.const()', () => {
	it('sets an individual value', () => {
		sheath.const('key1', 'val1')
		expect(sheath.const('key1')).toBe('val1')
	})
	
	it('sets multiple values', () => {
		sheath.const({
			key2: 'val2',
			key3: 3
		})
		expect(sheath.const('key2')).toBe('val2')
		expect(sheath.const('key3')).toBe(3)
	})
	
	it('freezes objects', () => {
		let arr = [1, 3, 5]
		sheath.const('key4', arr)
		expect(Object.isFrozen(sheath.const('key4'))).toBe(true)
		expect(arr.push.bind(arr, 77)).toThrowError(/object is not extensible/i)
	})
	
	it('disallows overrides', () => {
		expect(sheath.const.bind(null, 'key1', 'new-val')).toThrowError(/overwrite disallowed/i)
	})
	
	it('sets/gets a value during the config phase', () => {
		sheath.const('key5', 'val5')
		expect(sheath.const('key5')).toBe('val5')
	})
	
	it('sets/gets a value during the sync phase', () => {
		return new Promise((resolve) => {
			sheath.run(() => {
				sheath.const('key6', 'val6')
				resolve(sheath.const('key5') + sheath.const('key6'))
			})
		}).then((result) => {
			expect(result).toBe('val5val6')
		})
	})
	
	it('sets/gets a value during the async phase', () => {
		return new Promise((resolve) => {
			setTimeout(() => {
				sheath.const('key7', 'val7')
				resolve(sheath.const('key6') + sheath.const('key7'))
			})
		}).then((result) => {
			expect(result).toBe('val6val7')
		})
	})
})
