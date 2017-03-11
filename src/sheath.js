/*
	Sheath.js
	Another library by Joshua Claunch -- https://github.com/bowheart
*/
(function(outside, factory) {
	var serverSide = typeof module === 'object' && typeof module.exports === 'object',
		sheath = factory(!serverSide)

	serverSide
		? module.exports = sheath
		: outside.sheath = sheath
}(this, function(inBrowser) {
	/*
		Sheath -- A private utility for keeping track of/manipulating modules.
		Moves all modules through this process:
		[declaration received] -> [added to 'declaredModules' list] -> [dependencies defined] -> [definitionFunction called] -> [added to 'definedModules' list]
	*/
	var Sheath = {
		URL_REGEX: /\/|\./,
		
		addDeclaredModule: function(module) {
			if (this.declaredModules[module.name]) throw new Error('Sheath.js Error: Multiple modules with the same name found. Name: "' + module.name + '"')
			this.declaredModules[module.name] = module

			if (!this.dependents[module.name]) this.dependents[module.name] = []
			if (this.devMode && this.dependents[module.name].length) {
				this.checkCircularDep(module) // this module has been listed as a dependency of other modules; check for circular dependencies (devMode only)
			}
		},

		addDefinedModule: function(module) {
			this.definedModules[module.name] = module

			if (!this.dependents[module.name]) return // nothing more to do

			var dependents = this.dependents[module.name]
			for (var i = 0; i < dependents.length; i++) {
				var dependent = dependents[i]
				dependent.resolveDep(module)
			}
		},

		addDependent: function(module, depName) {
			if (!this.dependents[depName]) this.dependents[depName] = []
			this.dependents[depName].push(module)

			// If the dep is already met, check it off the module's list.
			if (this.definedModules[depName]) return module.readyDeps.push(this.definedModules[depName])

			// Defer attempting to load this dep asynchronously until the current execution thread ends (in case the dep's declaration takes place between now and then).
			setTimeout(this.loadAsync.bind(this, depName))
		},
		
		asyncLoaderFactory: function(moduleName, fileName, onload, sync) {
			var loader = new (inBrowser ? ClientLoader : ServerLoader)(moduleName, fileName, onload, sync)
			loader.load()
		},

		/*
			asyncResolver() -- takes a module's name and returns the filename--the `src` attribute of an async <script> tag to request this module.
			This is just the default! It is meant to be overridden using sheath.asyncResolver() (below).
		*/
		asyncResolver: function(module) {
			// The default async filename resolver just assumes that the module name is the filepath minus the '.js' extension.
			return module + '.js'
		},

		checkCircularDep: function(module) {
			var modules = [],
				result = this.dfs(modules, module)

			if (!result) return

			modules.push(modules[0])
			console.warn('Sheath.js Warning: Circular dependency detected.\n\n    {' + modules.join('} -> {') + '}')
		},

		declareInitialModules: function() {
			for (var i = 0; i < this.initialModules.length; i++) {
				var module = this.initialModules[i]
				this.moduleFactory(module.name, module.deps, module.factory)
			}
		},

		defineConst: function(key, val) {
			if (this.constants[key]) throw new Error('Sheath.js Error: Const "' + key + '" is already defined. Overwrite disallowed.')
			this.constants[key] = val
		},

		// A simple Depth-First Search used to detect back edges (circular dependencies).
		dfs: function(chain, currentModule) {
			if (!currentModule) return false
			if (currentModule.name === chain[0]) return true // back edge found
			if (~chain.indexOf(currentModule.name)) return false // back edge found, but not involving target node; ignore

			chain.push(currentModule.name) // put the current module on there
			var deps = currentModule.deps,
				depsKeys = Object.keys(deps)

			for (var i = 0; i < depsKeys.length; i++) {
				var result = this.dfs(chain, this.declaredModules[deps[depsKeys[i]].name])

				if (result) return result
			}
			chain.pop() // not found down this chain; take the current module off of there and go back up
			return false
		},

		extend: function(a, b) {
			Object.keys(b).forEach(function(key) {
				a[key] = b[key]
			})
			return a
		},

		isUrl: function(str) {
			return str && typeof str === 'string' && this.URL_REGEX.test(str)
		},
		
		libFactory: function(moduleName, globalName, fileName) {
			var newLib = new Lib(moduleName, globalName, fileName)
			newLib.declare()
			newLib.define()
		},

		/*
			loadAsync() -- For each 'names', finds the module's filename and:
			In the browser: Creates a <script> tag (if one hasn't been created).
			On the server: loads and evals the file's contents.
		*/
		loadAsync: function(names) {
			if (!this.asyncPhase || !this.asyncEnabled) return // lazy-loading is disabled
			if (!Array.isArray(names)) names = [names]

			for (var i = 0; i < names.length; i++) {
				var name = names[i]
				if (this.declaredModules[name]) continue // we've already found a declaration for this module

				var filename = this.asyncResolver(name)
				if (!filename) continue // no file found for this module
				
				this.asyncLoaderFactory(name, filename)
			}
		},
		
		moduleFactory(name, deps, factory) {
			var newModule = new Module(name, deps, factory)
			newModule.declare()
			newModule.define() // attempt to define this module synchronously, in case there are no deps
		},

		taskEnd: function() {
			this.tasks.pop()
		},

		taskStart: function(task) {
			this.tasks.push(task)
		},

		toPhase: function(phase) {
			this.phase = phase
			if (phase === 'sync') {
				this.declareInitialModules()
				return
			}
			// async phase
			var undeclaredModules = this.undeclaredModules()
			if (this.devMode && !this.asyncEnabled && undeclaredModules.length) {
				console.warn('Sheath.js Warning: Lazy-loading disabled. Sync Phase ended and undeclared modules found. Modules:', this.undeclaredModules(true))
			}
			this.loadAsync(undeclaredModules)
		},
		
		// Turn all own properties of an object into their property descriptors
		toPropertyDescriptors: function(obj) {
			var propertyDescriptors = {}
			Object.keys(obj).forEach(function(key) {
				propertyDescriptors[key] = Object.getOwnPropertyDescriptor(obj, key)
			})
			return propertyDescriptors
		},
		
		// A simple Depth-First Search used to find the optimal load-order of all modules in the given module's dependency graph.
		tree: function(moduleName, modules) {
			if (~modules.indexOf(moduleName)) return modules
			
			var module = this.declaredModules[moduleName]
			if (!module) return []
			for (var i = 0; i < module.rawDeps.length; i++) {
				this.tree(module.rawDeps[i], modules)
			}
			modules.push(moduleName)
			return modules
		},
		
		// undeclaredModules() -- Returns the list of all modules that have been listed as dependencies but never declared.
		undeclaredModules: function(includeInfo) {
			var self = this
			
			var moduleNames = Object.keys(this.dependents).filter(function(module) {
				return !self.declaredModules[module] // find the dependencies that have never been declared
			})
			if (!includeInfo) return moduleNames
			
			// If a human's gonna read this, throw some extra info in there.
			return moduleNames.map(function(moduleName) {
				return {
					name: moduleName,
					dependents: self.dependents[moduleName].map(function(module) { return module.name })
				}
			})
		},
		
		get devMode() { return this.mode === 'dev' || this.mode === 'analyze' },
		get analyzeMode() { return this.mode === 'analyze' },
		get configPhase() { return this.phase === 'config' },
		get asyncPhase() { return this.phase === 'async' },
		get global() {
			return inBrowser ? window : global
		},
		
		asyncEnabled: true, // async is enabled by default
		constants: {},
		declaredModules: {}, // keeps track of all module declarations we've encountered throughout the lifetime of this app
		definedModules: {},
		mode: 'production', // by default, Sheath is in productionMode; devMode and analyzeMode must be enabled manually
		accessor: '.', // by default, a period accesses a module fragment
		separator: '/', // by default, a slash indicates a submodule
		initialModules: [], // these are the modules found during the config phase that will need to be defined in the sync phase
		dependents: {}, // map dependencies to all dependents found for that module; this turns defining a module into a simple lookup -- O(1)
		phase: 'config', // Sheath begins in Config Phase; The two other phases will come in once all initial scripts are loaded
		tasks: []
	}
	
	
	/*
		Module -- A thing with an optional name and dependencies and a required definition function.
	*/
	var Module = function(name, deps, factory) {
		this.name = name
		this.deps = deps
		this.factory = factory
		this.depsLeft = deps.length
		this.resolvedDeps = []
		this.readyDeps = []
		this.interface = Object.create(null, {
			name: {
				get: function() { return name }
			},
			exports: {
				writable: true,
				value: {}
			}
		})

		this.mapDeps()
	}
	Module.prototype = {
		declare: function() {
			if (!this.name) return
			Sheath.addDeclaredModule(this)
		},

		define: function() {
			if (this.depsLeft > 0 || this.defined) return // there are more dependencies to resolve or we've already defined this module
			this.defined = true
			Sheath.analyzeMode ? this.saveDefinition() : this.implementDefine()
		},
		
		implementDefine: function() {
			Sheath.taskStart(this)
			var definition = this.factory.apply(this.interface, this.resolvedDeps)
			Sheath.taskEnd()
			
			this.saveDefinition(definition)
		},
		
		// Determine if the dep is relative ("../", "./", "/") or an import ("module.import").
		mapDep: function(name) {
			name = this.parseRelativeDep(name)
			return this.parseImport(name)
		},

		// Replace the array of deps with a map of depName -> depInfo.
		mapDeps: function() {
			var mappedDeps = {},
				rawDeps = []
			
			for (var i = 0; i < this.deps.length; i++) {
				var depName = this.deps[i]
				if (!depName) continue
				
				var mappedDep = this.mapDep(depName)
				mappedDep.index = i
				
				rawDeps.push(mappedDep.name)
				Sheath.addDependent(this, mappedDep.name)
				mappedDeps[mappedDep.name] = mappedDep
			}
			this.rawDeps = rawDeps
			this.deps = mappedDeps
			this.resolveReadyDeps()
		},
		
		parseImport: function(name) {
			var sep = Sheath.separator,
				acc = Sheath.accessor
			
			if (!acc) return {name: name} // fragments are disabled if the Accessor is set to ''
			
			var modulePath = name.split(sep),
				importPath = modulePath.pop().split(acc)
			
			return {
				name: modulePath.join(sep) + (modulePath.length ? sep : '') + importPath.shift(),
				import: importPath.length ? importPath : false
			}
		},
		
		parseRelativeDep: function(name) {
			var sep = Sheath.separator
			if (!sep) return name // relative paths are disabled if the Separator is set to ''
			
			// sheath('module', '/submodule') -> resolves to 'module/submodule'
			if (name.slice(0, sep.length) === sep) {
				return this.name + name
			}
			
			if (name[0] !== '.') return name // not a relative path
			var path = this.name.split(sep)
			
			// sheath('one/a', './b') -> resolves to 'one/b'
			if (name.slice(0, 1 + sep.length) === '.' + sep) {
				return path.slice(0, -1).join(sep) + name.slice(1)
			}
			
			// sheath('one/a/1', '../b/1') -> resolves to 'one/b/1'
			// sheath('one/a/1', '../../two') -> resolves to 'two'
			path.pop()
			while (name.slice(0, 2 + sep.length) === '..' + sep) {
				path.pop()
				name = name.slice(2 + sep.length)
			}
			return path.join(sep) + (path.length ? sep : '') + name
		},
		
		resolveDep: function(resolvedDep) {
			var depInfo = this.deps[resolvedDep.name]
			
			// If the dep is a fragment grab that, otherwise grab the resolvedDep's visage.
			var resolvedVal = depInfo.import
				? resolvedDep.resolveExport(depInfo.import)
				: resolvedDep.visage

			this.resolvedDeps[depInfo.index] = resolvedVal

			this.depsLeft--
			this.define()
		},

		resolveExport: function(exportPath, namespace) {
			var nextNode = exportPath.shift(), // shift() -- we should only need it once, so mutate away
				val = namespace ? namespace[nextNode] : this.visage && this.visage[nextNode]

			// Don't attempt to go any deeper if the val at this level is undefined or null.
			if (typeof val === 'undefined' || val === null) return val

			return exportPath.length ? this.resolveExport(exportPath, val) : val
		},

		resolveReadyDeps: function() {
			for (var i = 0; i < this.readyDeps.length; i++) {
				this.resolveDep(this.readyDeps[i])
			}
		},
		
		saveDefinition: function(definition) {
			if (typeof definition !== 'undefined') this.interface.exports = definition // a returned definition overrides any exports
			if (this.name) Sheath.addDefinedModule(this) // doesn't apply to nameless modules (modules added via sheath.run())
		},
		
		get visage() {
			return this.interface.exports
		}
	}
	
	var Lib = function(moduleName, globalName, fileName) {
		this.globalName = globalName
		this.fileName = fileName
		Module.call(this, moduleName, [])
	}
	Lib.prototype = Object.create(Module.prototype, Sheath.toPropertyDescriptors({
		implementDefine: function() {
			if (this.fileName) return this.load()
			this.onload()
		},
		
		load: function() {
			Sheath.asyncLoaderFactory(this.name, this.fileName, this.onload.bind(this), true)
		},
		
		onload: function() {
			var definition = Sheath.global[this.globalName] // grab the lib's interface off the global scope
			if (!definition && Sheath.devMode) {
				console.warn('Sheath.js Warning: Unable to create lib "' + this.name + '". Global property "' + this.globalName + '" not found. Make sure the library is loaded.')
			}
			this.saveDefinition(definition)
		}
	}))
	
	
	var AsyncLoader = function(moduleName, fileName, onload, sync) {
		this.moduleName = moduleName
		this.fileName = fileName
		this.onload = onload
		this.sync = sync
	}
	/*
		ClientLoader -- Implement asynchronous file loading for a browser environment.
	*/
	var ClientLoader = function() {
		AsyncLoader.apply(this, arguments)
	}
	ClientLoader.prototype = {
		abort: function() {
			// Defer condemning this dep until the current execution thread ends (in case its declaration occurs between now and then).
			setTimeout(function() {
				if (Sheath.declaredModules[this.moduleName]) return this.onload && this.onload() // it actually was declared; no problems
				
				// This script has already been loaded.
				if (Sheath.devMode) {
					console.warn('Sheath.js Warning: file "' + this.fileName + '" already loaded, but no declaration found for module "' + this.moduleName + '"')
				}
			}.bind(this), 100)
		},
		
		load: function() {
			if (this.scriptExists()) return this.abort()
			
			var script = document.createElement('script')
			if (Sheath.devMode) {
				script.onerror = function() {
					console.warn('Sheath.js Warning: Attempt to lazy-load module "' + this.moduleName + '" failed. Potential hang situation.')
				}.bind(this)
				
				script.onload = function() {
					if (Sheath.declaredModules[this.moduleName]) return this.onload && this.onload() // it actually was declared; no problems
					
					console.warn('Sheath.js Warning: Module file successfully loaded, but module "' + this.moduleName + '" not found. Potential hang situation.')
				}.bind(this)
			}
			script.async = !this.sync
			script.src = this.fileName
			document.head.appendChild(script)
		},
		
		scriptExists: function() {
			var scripts = document && document.scripts || []
			
			return Array.prototype.filter.call(scripts, function(script) {
				return script.getAttribute('src') === this.fileName
			}.bind(this)).length
		}
	}
	
	/*
		ServerLoader -- Implement asynchronous file loading for a server environment.
	*/
	var ServerLoader = function() {
		AsyncLoader.apply(this, arguments)
	}
	ServerLoader.prototype = {
		load: function() {
			try {
				ServerLoader.fs || (ServerLoader.fs = require('fs'))
				ServerLoader.vm || (ServerLoader.vm = require('vm'))
				ServerLoader.context || (ServerLoader.context = ServerLoader.vm.createContext({
					sheath: sheath,
					global: Sheath.global
				}))
				
				var fileContents = ServerLoader.fs.readFileSync(this.fileName).toString()
				ServerLoader.vm.runInContext(fileContents, ServerLoader.context)
				if (this.onload) this.onload()
			} catch (exception) {
				if (Sheath.devMode) {
					console.warn('Sheath.js Warning: Failed to find module "' + this.moduleName + '" on the server. Potential hang situation.')
				}
			}
		}
	}




	/*
		sheath() -- A utility for organized, encapsulated module definition and dependency injection.

		Parameters:
			name : string -- required -- The name of this module.
			deps : string | array -- optional -- The module or list of modules required by this module.
				Each of these must be the name of another module defined somewhere.
				If any dep in this list is not declared in the app and cannot be found by the async loader, the app will hang.
				These will be 'injected' into the factory.
			factory : function -- required -- The function that will be called to define this module.
				The parameters of this function will be this module's dependencies, in the order they were listed.
				Whatever is 'return'ed by this function will be injected into this module's dependents.
	*/
	var sheath = function(name, deps, factory) {
		if (typeof name === 'function') return name() // provide a sheath(() => {}) overload that just calls the function
		
		// Arg swapping -- deps is optional; if 'factory' doesn't exist, move it down.
		if (!factory) {
			factory = deps
			deps = []
		}
		if (typeof name !== 'string') {
			throw new TypeError('Sheath.js Error: sheath() expects the name to be a string. Received "' + typeof name + '".')
		}
		if (typeof factory !== 'function') {
			throw new TypeError('Sheath.js Error: sheath() expects the module definition to be a function. Received "' + typeof factory + '".')
		}
		if (typeof deps === 'string') deps = [deps] // if 'deps' is a string, make it the only dependency
		if (!Array.isArray(deps)) {
			throw new TypeError('Sheath.js Error: sheath() expects the deps to be a string or array of strings. Received "' + typeof deps + '".')
		}
		if (Sheath.configPhase) {
			Sheath.initialModules.push({name: name, deps: deps, factory: factory})
			return
		}
		Sheath.moduleFactory(name, deps, factory)
		return sheath // for chaining
	}
	
	
	/*
		sheath.config() -- A getter/setter extraordinaire for all config settings.
		Also controls a namespace of getters/setters for each config setting.
		All config methods return sheath.config for chaining.
	*/
	sheath.config = function(key, val) {
		if (typeof key === 'string') {
			if (!sheath.config[key]) throw new ReferenceError('Sheath.js Error: Invalid config setting "' + key + '" passed to sheath.config()')
			return sheath.config[key](val)
		}
		if (Array.isArray(key) || typeof key !== 'object') {
			throw new TypeError('Sheath.js Error: sheath.config() expects a key, key-value pair, or an object. Received "' + typeof key + '".')
		}
		
		Object.keys(key).forEach(function(prop) {
			if (!sheath.config[prop]) throw new ReferenceError('Sheath.js Error: Invalid config setting "' + prop + '" passed to sheath.config()')
			sheath.config[prop](key[prop])
		})
		return sheath.config
	}
	
	
	/*
		sheath.config.accessor() -- A getter/setter for Sheath.accessor -- the char sequence used to access a module fragment.
	*/
	sheath.config.accessor = function(accessor) {
		if (typeof accessor === 'undefined') return Sheath.accessor
		if (!Sheath.configPhase) {
			throw new Error('Sheath.js Error: accessor can only be set in the config phase.')
		}
		if (typeof accessor !== 'string') throw new TypeError('Sheath.js Error: accessor must be a string')
		if (accessor === Sheath.separator) throw new Error('Sheath.js Error: Accessor and separator cannot be the same.')
		
		Sheath.accessor = accessor
		return sheath.config // for chaining
	}


	/*
		sheath.config.async() -- A getter/setter to see/define the status of the async loader.
		Pass true to activate async loading, false to deactivate.
		Async loading is turned on by default.
	*/
	sheath.config.async = function(val) {
		if (typeof val === 'undefined') return Sheath.asyncEnabled
		if (!Sheath.configPhase) throw new Error('Sheath.js Error: lazy-loading can only enabled/disabled in the Config Phase.')

		Sheath.asyncEnabled = Boolean(val)
		return sheath.config // for chaining
	}


	/*
		sheath.config.asyncResolver(function) -- The default async filename resolver doesn't do much. Use this guy to beef it up.
	*/
	sheath.config.asyncResolver = function(newResolver) {
		if (!newResolver) return Sheath.asyncResolver
		if (!Sheath.configPhase) throw new Error('Sheath.js Error: asyncResolver can only be set in the config phase.')
		if (typeof newResolver !== 'function') throw new TypeError('Sheath.js Error: Custom asyncResolver must be a function')

		Sheath.asyncResolver = newResolver
		return sheath.config // for chaining
	}


	/*
		sheath.config.baseModel() -- A getter/setter for the baseModel to be used by sheath.model() as the default parent prototype.
	*/
	sheath.config.baseModel = function(baseModel) {
		if (typeof baseModel === 'undefined') return Sheath.baseModel

		if (!Sheath.configPhase) {
			throw new Error('Sheath.js Error: baseModel can only be set in the config phase.')
		}
		if (typeof baseModel !== 'object') {
			throw new TypeError('Sheath.js Error: baseModel must be an object or null. Found "' + typeof baseModel + '"')
		}
		if (baseModel === null) {
			Sheath.baseModel = null
			return sheath
		}

		var constructor = baseModel.init || function ModelBase() {}
		constructor.prototype = Object.create(baseModel, Sheath.toPropertyDescriptors(baseModel))

		Sheath.baseModel = constructor
		return sheath.config // for chaining
	}


	/*
		sheath.config.baseObject() -- A getter/setter for the baseObject to be used by sheath.object() as the default parent prototype.
	*/
	sheath.config.baseObject = function(baseObject) {
		if (typeof baseObject === 'undefined') return Sheath.baseObject

		if (!Sheath.configPhase) {
			throw new Error('Sheath.js Error: baseObject can only be set in the config phase.')
		}
		if (typeof baseObject !== 'object') {
			throw new TypeError('Sheath.js Error: baseObject must be an object or null. Found "' + typeof baseObject + '"')
		}

		Sheath.baseObject = baseObject
		return sheath.config // for chaining
	}


	/*
		sheath.config.emulateBrowser() -- A getter/setter for whether Sheath is currently running in browser-mode.
		This is used to find the global object and to implement asynchronous loading.
		This should really only be used for testing purposes.
	*/
	sheath.config.emulateBrowser = function(val) {
		if (typeof val === 'undefined') return inBrowser
		if (!Sheath.configPhase) {
			throw new Error('Sheath.js Error: Browser emulation can only be modified during the config phase.')
		}
		inBrowser = Boolean(val)
		return sheath.config // for chaining
	}


	/*
		sheath.config.mode() -- A getter/setter to get the status of and enable/disable advanced debugging/analysis tools.
	*/
	sheath.config.mode = function(val) {
		if (typeof val === 'undefined') return Sheath.mode
		if (!Sheath.configPhase) {
			throw new Error('Sheath.js Error: mode can only be set in the config phase.')
		}
		switch (val) {
			case 'dev': case 'analyze': case 'production':
				Sheath.mode = val
				break
			default:
				throw new ReferenceError('Sheath.js Error: "' + val + '" is not a valid mode. Valid modes are "production", "dev", and "analyze"')
		}
		return sheath.config // for chaining
	}
	
	
	/*
		sheath.config.separator() -- A getter/setter for Sheath.separator -- the char sequence used to delineate a submodule.
	*/
	sheath.config.separator = function(sep) {
		if (typeof sep === 'undefined') return Sheath.separator
		if (!Sheath.configPhase) {
			throw new Error('Sheath.js Error: accessor can only be set in the config phase.')
		}
		if (typeof sep !== 'string') throw new TypeError('Sheath.js Error: separator must be a string. Received "' + typeof sep + '".')
		if (sep === Sheath.accessor) throw new Error('Sheath.js Error: Separator and accessor cannot be the same.')
		
		Sheath.separator = sep
		return sheath.config // for chaining
	}


	/*
		sheath.const() -- Use to declare/fetch universal constants -- immutable values that the whole app should have access to.
	*/
	sheath.const = function(key, val) {
		if (typeof key === 'string') {
			if (typeof val === 'undefined') return Sheath.constants[key]
			if (typeof val === 'object') Object.freeze(val)

			Sheath.defineConst(key, val)
			return sheath // for chaining
		}
		if (typeof key !== 'object') throw new TypeError('Sheath.js Error: sheath.const() expects either a key and a value, or an object. Received: "' + typeof key + '"')
		Object.keys(key).forEach(function(prop) {
			Sheath.defineConst(prop, key[prop])
		})
		return sheath // for chaining
	}


	/*
		sheath.current() -- Get the name of the module currently being defined. Use to reduce duplication.
	*/
	sheath.current = function() {
		if (!Sheath.tasks.length) {
			console.warn('Sheath.js Warning: No module is currently being defined. Call to sheath.current() will return null.')
			return null
		}
		return Sheath.tasks[Sheath.tasks.length - 1].interface
	}


	/*
		sheath.dependents() -- Returns a map of modules -> dependents
		An analysis tool.
	*/
	sheath.dependents = function() {
		var map = {}
		Object.keys(Sheath.dependents).forEach(function(moduleName) {
			map[moduleName] = Sheath.dependents[moduleName].map(function(dep) { return dep.name }) // map so we're not exposing internal objects
		})
		return map
	}
	
	
	/*
		sheath.forest() -- Find all modules in the dependency graph of a given module (a 'tree').
		If no moduleName is passed, find all trees of all app-level modules -- modules that have no dependents.
	*/
	sheath.forest = function(moduleName) {
		if (moduleName) {
			if (typeof moduleName !== 'string') {
				throw new TypeError('Sheath.js Error: sheath.forest() expects moduleName to be a string, if specified. Received "' + typeof moduleName + '"')
			}
			if (!Sheath.declaredModules[moduleName]) return []
			return Sheath.tree(moduleName, [])
		}
		
		var forest = {}
		Object.keys(Sheath.dependents).forEach(function(moduleName) {
			var dependents = Sheath.dependents[moduleName]
			if (dependents.length) return // we only care about modules that have not been required by any other modules
			
			forest[moduleName] = Sheath.tree(moduleName, [])
		})
		return forest
	}
	
	
	/*
		sheath.instance() -- Create a model and immediately return an instance of it.
		Used for creating static classes.
		Really only differs from sheath.object() in that the init() function is taken into account.
		This means mutatable properties (arrays, functions, objects) can be set in the init function, avoiding copying pointers across multiple instances of the object.
	*/
	sheath.instance = function(parent, model) {
		sheath.instance.active = true
		var Model = sheath.model(parent, model)
		sheath.instance.active = false
		return new Model()
	}
	
	
	/*
		sheath.lib() -- An easy way to encapsulate/incorporate third-party libraries.
	*/
	sheath.lib = function lib(moduleName, globalName, fileName) {
		if (typeof moduleName !== 'string') {
			throw new TypeError('Sheath.js Error: sheath.lib() expects the name to be a string. Received "' + typeof moduleName + '".')
		}
		// Arg swapping -- if 'globalName' is a url, it isn't a valid identifier and is actually the filename; move 'fileName' down.
		if (Sheath.isUrl(globalName)) {
			fileName = globalName
			globalName = undefined
		}
		if (!globalName) globalName = moduleName // allow overload: sheath.lib('Backbone')
		if (typeof globalName !== 'string') {
			throw new TypeError('Sheath.js Error: sheath.lib() expects the global identifier to be a string. Received "' + typeof globalName + '".')
		}
		if (fileName && typeof fileName !== 'string') {
			throw new TypeError('Sheath.js Error: sheath.lib() expects file name to be a string, if specified. Received "' + typeof fileName + '".')
		}
		Sheath.libFactory(moduleName, globalName, fileName)
		return lib
	}
	
	
	/*
		sheath.missing() -- Returns the names of all the modules the app is waiting on.
		These are modules that have been listed as dependencies of other modules, but that haven't been declared yet.
		Call this from the console when you suspect the app is hanging.
		An analysis tool.
	*/
	sheath.missing = function() {
		return Sheath.undeclaredModules(true)
	}


	/*
		sheath.model() -- An easy interface for declaring JavaScript 'classes' with inheritance.

		Params:
			parent : function -- optional -- The constructor function whose prototype this model will inherit.
			model : object -- required -- The class definition. If the object has an 'init()' property (optional), it will become the class constructor.
	*/
	sheath.model = function(parent, model) {
		// sheath.instance() uses sheath.model() internally. Find which one the user called for better error reporting.
		var funcName = sheath.instance.active ? 'sheath.instance()' : 'sheath.model()'
		if (Sheath.configPhase) {
			throw new Error('Sheath.js Error: ' + funcName + ' cannot be called during the config phase. Use sheath.run() to defer execution.')
		}

		// Arg swapping -- 'parent' is optional; if 'model' doesn't exist, move it down.
		if (!model) {
			model = parent
			parent = Sheath.baseModel
		}

		// Make sure the model param is valid.
		if (typeof model !== 'object') throw new TypeError('Sheath.js Error: ' + funcName + ' expects the model to be an object. Received "' + typeof model + '".')

		// Make sure the parent param is valid, if it was given.
		if (parent && typeof parent !== 'function') {
			throw new TypeError('Sheath.js Error: ' + funcName + ' expects the parent to be a constructor function. Received "' + typeof parent + '".')
		}

		// Make sure the init property is valid, if it was given.
		if (model.init && typeof model.init !== 'function') {
			throw new TypeError('Sheath.js Error: ' + funcName + ' expects model "init" property to be a function. Received "' + typeof model.init + '".')
		}

		// Set up the constructor. This will auto-call the `init` method, if one exists anywhere on the prototype chain.
		var constructor = function Model() {
			if (this.init) return this.init.apply(this, arguments)
		}

		// Implement the inheritance (if user gave a parent model) and make the rest of the model the prototype
		var parentPrototype = parent ? parent.prototype : null
		constructor.prototype = Object.create(parentPrototype, Sheath.toPropertyDescriptors(model))

		return constructor
	}


	/*
		sheath.object() -- An easy interface for declaring JavaScript objects with custom and inheriting prototypes.

		Params:
			parent : object -- optional -- The prototype object from which this object will inherit.
			object : object -- optional -- (Required if parent is specified) The new object you want created.
	*/
	sheath.object = function(parent, object) {
		if (Sheath.configPhase) throw new Error('Sheath.js Error: sheath.model() cannot be called during the config phase. Use sheath.run() to defer execution.')

		// Arg swapping -- 'parent' is optional; if 'object' doesn't exist, move it down.
		if (!object) {
			object = parent || {} // set it to an empty object if nothing was passed in
			parent = Sheath.baseObject
		}

		// Make sure the object param is valid.
		if (typeof object !== 'object') throw new TypeError('sheath.object() error: object must be an object')

		// Make sure the parent param is valid, if it was given.
		if (parent && typeof parent !== 'object') {
			throw new TypeError('sheath.object() error: parent must be an object')
		}

		// Make the parent the object's prototype.
		object = Object.create(parent || null, Sheath.toPropertyDescriptors(object))

		return object
	}


	/*
		sheath.phase() -- A debugging utility. This will return the life phase that Sheath is currently in.
		Use this to familiarize yourself with Sheath's life cycle.
		An analysis tool.
	*/
	sheath.phase = function() {
		return Sheath.phase
	}


	/*
		sheath.run() -- Run some code that leverages Sheath's dependency injection, but without declaring a module.
		Useful for circumventing circular dependencies.
		The 'deps' arg is optional, so this can also be used to defer execution until after the config phase.
	*/
	sheath.run = function(deps, func) {
		// Arg swapping -- deps is optional; if 'func' doesn't exist, move it down.
		if (!func) {
			func = deps
			deps = []
		}
		if (typeof func !== 'function') {
			throw new TypeError('Sheath.js Error: sheath.run() expects a function. Received "' + typeof func + '".')
		}
		if (typeof deps === 'string') deps = [deps] // if 'deps' is a string, make it the only dependency
		if (!Array.isArray(deps)) {
			throw new TypeError('Sheath.js Error: sheath.run() expects the deps to be a string or array of strings. Received "' + typeof deps + '".')
		}
		if (Sheath.configPhase) {
			Sheath.initialModules.push({name: '', deps: deps, factory: func})
			return
		}
		Sheath.moduleFactory('', deps, func)
		return sheath // for chaining
	}
	
	
	/*
		sheath.store() -- Create a data-store on an array. Exposes all common, non-mutating methods of Array.prototype.
	*/
	var nonMutating = ['every', 'filter', 'forEach', 'indexOf', 'join', 'lastIndexOf', 'map', 'reduce', 'reduceRight', 'slice', 'some']
	sheath.store = function(arr, props) {
		if (!Array.isArray(arr)) {
			throw new TypeError('Sheath.js Error: sheath.store() expects the first parameter to be an array. Received "' + typeof arr + '".')
		}
		if (props && typeof props !== 'object') {
			throw new TypeError('Sheath.js Error: sheath.store() expects the second parameter, if given, to be an object. Received "' + typeof props + '".')
		}

		var store = {}

		// Put all the non-mutating methods of Array.prototype on there.
		for (var i = 0; i < nonMutating.length; i++) {
			var key = nonMutating[i]
			if (typeof arr[key] === 'function') store[key] = arr[key].bind(arr)
		}

		// Put a length getter on there
		Object.defineProperty(store, 'length', {
			get: function() { return arr.length }
		})

		// Make the store iterable (es6 only)
		if (typeof Symbol === 'function' && Symbol.iterator) {
			store[Symbol.iterator] = function StoreIterator() {
				var index = 0
				return {next: function() {
					return arr[index] ? {value: arr[index++], done: false} : {done: true}
				}}
			}
		}
		return Sheath.extend(store, props || {})
	}


	/*
		sheath.toString() -- Just for flair, override the default toString() method.
	*/
	sheath.toString = function() {
		return 'I Am Sheath'
	}




	/*
		Once all the initial scripts have been loaded:
		Run the sync phase, then:
		Turn on asychronous loading and request any not-yet-declared modules.
	*/
	var advancePhases = function() {
		Sheath.toPhase('sync')

		// setTimeout -- allow any deferred tasks set during the sync phase to complete before advancing to the async phase
		setTimeout(Sheath.toPhase.bind(Sheath, 'async'))
	}
	inBrowser
		? (window.onload = advancePhases)
		: setTimeout(advancePhases)

	return sheath
}))
