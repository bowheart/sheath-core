'use strict'

const sheath = require('../../../src/sheath')



describe('sheath()', () => {
	it('just returns the result of calling name() if name is a function', () => {
		expect(sheath(() => 'val')).toBe('val')
	})
	
	it('asserts that the name is a string', () => {
		expect(sheath.bind(null, {}, () => {})).toThrowError(/expects .* a string/i)
	})
	
	it('asserts that a function is passed', () => {
		expect(sheath.bind(null, 'invalid', 'func')).toThrowError(/expects .*a function/i)
		expect(sheath.bind(null, 'invalid', [], 'func')).toThrowError(/expects .*a function/i)
	})
	
	it('asserts that the deps is a string or array', () => {
		expect(sheath.bind(null, 'invalid', {}, () => {})).toThrowError(/string or array/i)
		expect(sheath.bind(null, 'valid1', [], () => {})).not.toThrow()
		console.warn = jest.fn()
		expect(sheath.bind(null, 'valid2', 'deps', () => {})).not.toThrow()
		expect(sheath.bind(null, 'valid3', () => {})).not.toThrow()
	})
	
	it('asserts that the module name does not start with the separator', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			expect(sheath.bind(null, '/invalid', () => {})).toThrowError(/cannot start with the separator/i)
		})
	})
	
	it('asserts that the module name does not start with "."', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			expect(sheath.bind(null, '../invalid', () => {})).toThrowError(/cannot be relative/i)
		})
	})
	
	it('asserts that the module name does not contain the accessor', () => {
		return new Promise(resolve => {
			sheath.run(resolve)
		}).then(result => {
			expect(sheath.bind(null, 'invalid.module', () => {})).toThrowError(/cannot contain the accessor/i)
		})
	})
	
	it('creates a module', () => {
		return new Promise(resolve => {
			sheath('module1', () => {
				resolve('module created')
				return 'visage1'
			})
		}).then(result => {
			expect(result).toBe('module created')
		})
	})
	
	it('injects a module', () => {
		return new Promise(resolve => {
			sheath('module2', 'module1', (module1) => {
				resolve(module1)
				return 'visage2'
			})
		}).then((visage) => {
			expect(visage).toBe('visage1')
		})
	})
	
	it('waits for dependencies to be defined before injecting', () => {
		return new Promise(resolve => {
			sheath('module3', 'module3b', (module3b) => {
				resolve(module3b)
				return 'visage3'
			})
			
			sheath('module3b', () => 'visage3b')
		}).then((visage) => {
			expect(visage).toBe('visage3b')
		})
	})
	
	it('injects multiple modules', () => {
		return new Promise(resolve => {
			sheath('module4', ['module1', 'module3'], (module1, module3) => {
				resolve(module1 + module3)
				return 'visage4'
			})
		}).then(result => {
			expect(result).toBe('visage1visage3')
		})
	})
	
	it('can be chained', () => {
		return new Promise(resolve => {
			sheath('module5', () => 'visage5')
				('module6', 'module5', (module5) => {
					resolve(module5)
					return 'visage6'
				})
		}).then(result => {
			expect(result).toBe('visage5')
		})
	})
	
	it('loads undeclared modules asynchronously', () => {
		return new Promise(resolve => {
			sheath('module7', 'test/async-module', (module) => {
				resolve(module)
				return 'visage7'
			})
		}).then(result => {
			expect(result).toBe('async-visage')
		})
	})
	
	it('cannot declare two modules with the same name', () => {
		return new Promise(resolve => {
			setTimeout(resolve)
		}).then(result => {
			expect(sheath.bind(null, 'module7', () => {})).toThrowError(/multiple modules .*same name/i)
		})
	})
	
	it('can require submodules of the current module by prefixing the dep name with the Separator', () => {
		return new Promise(resolve => {
			sheath('module8', ['/one', '/two'], (one, two) => {
				resolve(one + two)
			})
			sheath('module8/one', () => 'one')
			sheath('module8/two', () => 'two')
		}).then(result => {
			expect(result).toBe('onetwo')
		})
	})
	
	it('can require siblings of the current module by prefixing the dep name with "." + the Separator', () => {
		return new Promise(resolve => {
			sheath('module9/a', ['./b', './c'], (b, c) => {
				resolve(b + c)
			})
			sheath('module9/b', () => 'b')
			sheath('module9/c', () => 'c')
		}).then(result => {
			expect(result).toBe('bc')
		})
	})
	
	it('can require uncles, great-uncles, etc of the current module by prefixing the dep name with ".." + the Separator (chained indefinitely)', () => {
		return new Promise(resolve => {
			sheath('module10/one/a', ['../two', '../../module9/b'], (two, b) => {
				resolve(two + b)
			})
			sheath('module10/two', () => '10/two')
		}).then(result => {
			expect(result).toBe('10/twob')
		})
	})
	
	it('has a cool name (the toString() method is overridden)', () => {
		expect(sheath + '').toBe('I Am Sheath')
	})
})
