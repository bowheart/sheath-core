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
	'use strict'
	
	/*
		Assert -- Group all assertions into one place for easy re-use and removal for production builds of Sheath.
	*/
	var Assert = {
		SPACE: / /,
		_func: '',
		
		array: function(val, name) {
			if (!Array.isArray(val)) this.error(TypeError, name, val, 'an array')
		},
		
		configPhase: function(message) {
			if (!Sheath.configPhase) this.error(Error, message || 'Setting can only be set during the Config Phase.')
		},
		
		constNotDeclared: function(key) {
			if (Sheath.constants[key]) this.error(Error, 'Const "' + key + '" is already defined. Overwrite disallowed.')
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
				var result = this.dfs(chain, Sheath.declaredModules[deps[depsKeys[i]].name])
				
				if (result) return result
			}
			chain.pop() // not found down this chain; take the current module off of there and go back up
			return false
		},
		
		error: function(type, name, val, expectation) {
			// Allow for custom messages:
			var message = this.SPACE.test(name)
				? name
				: name + ' must be ' + expectation + '. Received "' + typeof val + '"'
			
			throw new type('Sheath.js Error - ' + this._func + ' - ' + message)
		},
		
		falsy: function(val, name) {
			if (val) this.error(Error, name, val, 'falsy')
		},
		
		func: function(val, name) {
			if (typeof val !== 'function') this.error(TypeError, name, val, 'a function')
		},
		
		libLoaded: function(err, definition, libName, globalName) {
			if (err || typeof definition === 'undefined' && Sheath.devMode) {
				this.warn('Unable to create lib "' + libName + '". Global property "' + globalName + '" not found. Make sure the library is loaded.')
			}
		},
		
		loadNotFailed: function(loader, loadable) {
			if (!Sheath.devMode) return // check only applicable in devMode
			
			loadable.onerror = function() {
				var description = loader.moduleName ? 'module "' + loader.moduleName + '"' : 'file "' + loader.fileName + '"'
				this.warn('Attempt to lazy-load ' + description + ' failed. Potential hang situation.')
			}.bind(this)
		},
		
		moduleFoundInFile: function(moduleName) {
			if (Sheath.devMode && moduleName && !Sheath.declaredModules[moduleName]) {
				this.warn('Module file successfully loaded, but module "' + moduleName + '" not found. Potential hang situation.')
			}
		},
		
		noCircularDeps: function(module) {
			if (!Sheath.devMode || !Sheath.dependents[module.name].length) return
			
			// This module has been listed as a dependency of other modules; check for circular dependencies (devMode only).
			var modules = [],
				result = this.dfs(modules, module)
			
			if (!result) return
			
			modules.push(modules[0])
			this.warn('Circular dependency detected.\n\n    "' + modules.join('" -> "') + '"')
		},
		
		noNamespaceCollision: function(name) {
			if (sheath[name]) this.error(Error, 'Mod name "' + name + '" already exists in the sheath namespace.')
		},
		
		noUndeclaredModules: function(undeclaredModules) {
			// This check only applies in devMode when async loading is disabled.
			if (Sheath.devMode && !Sheath.asyncEnabled && undeclaredModules.length) {
				this.warn('Lazy-loading is disabled, but the Sync Phase has ended and the following modules have not been declared:', Sheath.undeclaredModules(true))
			}
		},
		
		notADuplicateModuleName: function(name) {
			if (Sheath.declaredModules[name]) this.setFunc('Duplicate Modules').error(Error, 'Multiple modules declared with name "' + name + '"')
		},
		
		notConfigPhase: function() {
			if (Sheath.configPhase) this.error(Error, 'This method cannot be called during the Config Phase. Use sheath.run() to defer execution.')
		},
		
		object: function(val, name) {
			if (Array.isArray(val) || typeof val !== 'object') this.error(TypeError, name, val, 'an object')
		},
		
		set: function(val, name) {
			if (typeof val === 'undefined') this.error(TypeError, name, val, 'set')
		},
		
		setFunc: function(funcName) {
			this._func = funcName
			return this // for chaining
		},
		
		string: function(val, name) {
			if (typeof val !== 'string') this.error(TypeError, name, val, 'a string')
		},
		
		task: function() {
			if (!Sheath.tasks.length) this.warn('No module is currently being defined. Call to sheath.current() will return null.')
		},
		
		truthy: function(val, name) {
			if (!val) this.error(Error, name, val, 'truthy')
		},
		
		validConfigSetting: function(val) {
			if (!sheath.config[val]) this.setFunc('sheath.config()').error(ReferenceError, 'Invalid config setting "' + val + '"')
		},
		
		validDepName: function(moduleName, oldName, newName) {
			this.setFunc('Invalid Dependency "' + oldName + '"')
			this.truthy(newName, 'Dependencies cannot be empty')
			
			var sep = Sheath.SEPARATOR
			if (newName.slice(-sep.length) === sep) {
				this.error(Error, 'Dependency names cannot end with "' + sep + '"')
			}
		},
		
		validMode: function(val) {
			if (!~['production', 'development', 'analyze'].indexOf(val)) this.error(Error, 'Invalid mode "' + val + '". Valid modes are "production", "development", and "analyze"')
		},
		
		validMods: function(moduleName, mods) {
			this.setFunc('Module "' + moduleName + '"')
			for (var i = 0; i < mods.length; i++) {
				if (!Sheath.mods[mods[i]]) this.error(ReferenceError, 'Unregistered modifier "' + mods[i] + '" used. Make sure the mod is loaded during the config phase.')
			}
		},
		
		validModuleName: function(name) {
			if (name === false) return // a NamelessModule; ignore
			
			this.setFunc('Invalid Module Name')
			this.truthy(name, 'Module names cannot be empty')
			
			var culprit = '. The culprit: "' + name + '"'
			if (name[0] === '.') {
				this.error(Error, 'Module names cannot be relative (they can\'t start with ".")' + culprit)
			}
			
			var sep = Sheath.SEPARATOR
			if (sep && (name.slice(0, sep.length) === sep || name.slice(-sep.length) === sep)) {
				this.error(Error, 'Module names cannot start or end with "' + sep + '"' + culprit)
			}
			
			var acc = Sheath.ACCESSOR
			if (acc && ~name.indexOf(acc)) {
				this.error(Error, 'Module names cannot contain "' + acc + '"' + culprit)
			}
			
			var pipe = Sheath.MOD_PIPE
			if (~name.indexOf(pipe)) {
				this.error(Error, 'Module names cannot contain the mod pipe ("' + pipe + '")' + culprit)
			}
		},
		
		warn: function(message) {
			if (!Sheath.devMode) return // warnings only available in devMode
			console.warn('Sheath.js Warning: ' + message)
		}
	}
	
	
	var Hook = {
		moduleDeclaredListeners: [],
		moduleDefinedListeners: [],
		
		mapDeps: function(module) {
			return module.rawDeps.map(function(dep) { return dep }) // map so that we hand a deep copy to the listener
		},
		
		moduleDeclared: function(module) {
			var deps = this.mapDeps(module)
			for (var i = 0; i < this.moduleDeclaredListeners.length; i++) {
				this.moduleDeclaredListeners[i](module.name, deps, module.factory)
			}
		},
		
		moduleDefined: function(module) {
			var deps = this.mapDeps(module)
			for (var i = 0; i < this.moduleDefinedListeners.length; i++) {
				this.moduleDefinedListeners[i](module.name, deps, module.visage)
			}
		}
	}
	
	
	/*
		Sheath -- A private utility for keeping track of/manipulating modules.
		Moves all modules through this process:
		[declaration received] -> [added to 'declaredModules' list] -> [dependencies defined] -> [factory called] -> [added to 'definedModules' list]
	*/
	var Sheath = {
		ACCESSOR: '.',
		MOD_PIPE: '!',
		SEPARATOR: '/',
		URL_REGEX: /\//,
		
		asyncEnabled: true, // async is enabled by default
		constants: {},
		declaredModules: {}, // keeps track of all module declarations we've encountered throughout the lifetime of this app
		definedModules: {},
		dependents: {}, // map dependencies to all dependents found for that module; this turns defining a module into a simple lookup -- O(1)
		initialModules: [], // these are the modules found during the config phase that will need to be defined in the sync phase
		linkedModules: {},
		mode: 'production', // by default, Sheath is in productionMode; devMode and analyzeMode must be enabled manually
		mods: {}, // the mod handlers for all registered mods; these will be called to handle injection of their custom module types
		phase: 'config', // Sheath begins in Config Phase. The two other phases will come in once all initial scripts are loaded
		requestedFiles: {}, // the filenames we've sent off requests for; catches duplicate requests; maps file names to content returned
		requestedModules: {}, // the modules we've sent off requests for; catches duplicate requests; maps module names to file names
		tasks: [],
		
		addDeclaredModule: function(module) {
			Assert.notADuplicateModuleName(module.name)
			this.declaredModules[module.name] = module
			
			if (!this.dependents[module.name]) this.dependents[module.name] = []
			Assert.noCircularDeps(module)
		},
		
		addDefinedModule: function(module) {
			this.definedModules[module.name] = module
			
			if (!this.dependents[module.name]) return // nothing more to do
			
			// Resolve all dependencies met by this module.
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
			if (this.definedModules[depName]) module.readyDeps.push(this.definedModules[depName])
		},
		
		asyncLoaderFactory: function(moduleName, fileName, onload, sync) {
			var loader = new (inBrowser ? ClientLoader : ServerLoader)(moduleName, fileName, onload, sync)
			loader.load()
		},
		
		/*
			asyncResolver() -- takes a module's name and returns the filename--the `src` attribute of an async <script> tag to request this module.
			This is just the default! It is meant to be overridden using sheath.config.asyncResolver() (below).
		*/
		asyncResolver: function(module) {
			// The default async filename resolver just assumes that the module name is the filepath minus the '.js' extension.
			return module + '.js'
		},
		
		declareInitialModules: function() {
			for (var i = 0; i < this.initialModules.length; i++) {
				var module = this.initialModules[i]
				this.moduleFactory(module.name, module.deps, module.factory)
			}
		},
		
		defineConst: function(key, val) {
			Assert.constNotDeclared(key)
			this.constants[key] = val
		},
		
		extend: function(a, b) {
			Object.keys(b).forEach(function(key) {
				a[key] = b[key]
			})
			return a
		},
		
		incorporateMod: function(name, mod) {
			Assert.setFunc('Mod "' + mod.name + '"')
			Assert.set(mod.api, 'All mods must have an "api" property.')
			Assert.func(mod.handle, 'All mods must have a "handle" function.')
			
			sheath[name] = mod.api // stick the mod's api in the sheath namespace
			this.mods[name] = mod.handle
		},
		
		isUrl: function(str) {
			return str && typeof str === 'string' && this.URL_REGEX.test(str)
		},
		
		link: function(name, deps, factory) {
			Assert.setFunc('sheath.link()')
			Assert.falsy(this.linkedModules[name], 'Module "' + name + '"already linked.')
			
			// Arg swapping -- deps is optional; if 'factory' doesn't exist, move it down.
			if (!factory) {
				factory = deps
				deps = []
			}
			Assert.string(name, 'Name')
			Assert.truthy(~name.indexOf(Sheath.MOD_PIPE), 'Linked modules must be custom (modifier) modules.')
			Assert.func(factory, 'Factory')
			if (typeof deps === 'string') deps = [deps] // if 'deps' is a string, make it the only dependency
			Assert.array(deps, 'If specified, deps must be a string or array of strings.')
			
			this.linkedModules[name] = {deps: deps, factory: factory}
			var module = this.declaredModules[name]
			if (!module) {
				// Create a spoof dep and let the dep load scheduler create and link a module to it.
				var dep = new Dep('', name)
				this.scheduleDepLoad(dep)
				return
			}
			
			module.link(deps, factory)
		},
		
		/*
			loadAsync() -- For each 'names', finds the module's filename and:
			In the browser: Creates a <script> tag (if one hasn't been created).
			On the server: loads (and evals, if a script) the file's contents.
		*/
		loadAsync: function(names) {
			if (!this.asyncPhase || !this.asyncEnabled) return // lazy-loading is disabled
			
			for (var i = 0; i < names.length; i++) {
				var name = names[i]
				if (this.declaredModules[name] || typeof this.requestedModules[name] !== 'undefined') {
					continue // this module has already been declared or we've already tried loading it
				}
				
				var filename = this.asyncResolver(name)
				this.requestedModules[name] = filename || ''
				if (!filename) continue // no file found for this module
				
				this.asyncLoaderFactory(name, filename)
			}
		},
		
		moduleFactory: function(name, deps, factory) {
			Assert.validModuleName(name)
			var newModule = new (name ? Module : NamelessModule)(name, deps, factory)
			newModule.declare()
			newModule.define() // attempt to define this module synchronously, in case there are no deps
		},
		
		scheduleDepLoad: function(dep) {
			if (!dep.mods.length) {
				// Defer attempting to load this dep asynchronously until the current execution thread ends (in case the dep's declaration takes place between now and then).
				return setTimeout(this.loadAsync.bind(this, [dep.name]))
			}
			
			// Sheath doesn't handle auto-loading custom modules. Create a Module with the dep and tell its mods to load it.
			if (this.declaredModules[dep.name]) return // a module of this dep has already been created; nothing to do here
			
			var newModule = new CustomModule(dep)
			newModule.declare()
			
			// If the modifier has already provided a linked module for this dep, link it. Otherwise, inform the modifier that it's got a new module.
			var linkedModule = this.linkedModules[dep.name]
			return linkedModule
				? newModule.link(linkedModule.deps, linkedModule.factory)
				: newModule.applyMods()
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
			Assert.noUndeclaredModules(undeclaredModules)
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
		
		get devMode() { return this.mode === 'development' || this.mode === 'analyze' },
		get analyzeMode() { return this.mode === 'analyze' },
		get configPhase() { return this.phase === 'config' },
		get asyncPhase() { return this.phase === 'async' },
		get global() {
			return inBrowser ? window : global
		}
	}
	
	
	
	/*
		Dep -- A thing had by a module.
		Deps can be relative (/module), (./module), (../../module).
		Deps can have imports (my.import) and mods (my!mod).
	*/
	var Dep = function(moduleName, name, index) {
		this.moduleName = moduleName
		this.index = index
		
		Assert.setFunc('Invalid dependency "' + name + '" for module "' + this.name + '"')
		Assert.string(name, 'Module dependencies must be strings.')
		
		// Determine if the dep is a custom type ("type!module") relative ("../", "./", "/") or an import ("module.import").
		this.parseMods(name)
		this.rawName = this.parseRelativeDep() // the rawName is the name with relative paths resolved and no mods prefixed
		this.name = this.modsStr + this.rawName // the name is the rawName with mods prefixed (this is the name the rest of sheath knows this dep by)
		
		if (!this.mods.length) this.parseImport(this) // imports only apply to internal modules; if there are mods, let them handle the other characters
	}
	Dep.prototype = {
		parseImport: function() {
			var name = this.name,
				sep = Sheath.SEPARATOR,
				acc = Sheath.ACCESSOR
			
			var modulePath = name.split(sep),
				importPath = modulePath.pop().split(acc)
			
			this.name = modulePath.join(sep) + (modulePath.length ? sep : '') + importPath.shift()
			this.import = importPath.length ? importPath : false
		},
		
		parseMods: function(name) {
			var pipe = Sheath.MOD_PIPE,
				mods = name.split(pipe),
				newName = mods.pop()
			
			Assert.validDepName(this.moduleName, name, newName)
			if (mods.length) Assert.validMods(this.moduleName, mods)
			
			this.name = newName
			this.modsStr = mods.join(pipe) + (mods.length ? pipe : '')
			this.mods = mods.reverse() // mods are applied in reverse order
		},
		
		parseRelativeDep: function() {
			var name = this.name,
				sep = Sheath.SEPARATOR
			
			// sheath('module', '/submodule') -> resolves to 'module/submodule'
			if (name.slice(0, sep.length) === sep) {
				return this.moduleName + name
			}
			
			if (name[0] !== '.') return name // not a relative path
			var path = this.moduleName.split(sep)
			
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
		
		this.createInterface(name)
		this.mapDeps()
	}
	Module.prototype = {
		addAsDefinedModule: function() {
			if (this.definitionSaved || this.deferring) return
			this.definitionSaved = true
			Hook.moduleDefined(this)
			Sheath.addDefinedModule(this)
		},
		
		createInterface: function(name) {
			this.interface = Object.create(null, {
				name: {
					get: function() { return name }
				},
				defer: {
					value: this.defer.bind(this)
				},
				exports: {
					writable: true,
					value: {}
				},
				resolve: {
					value: this.resolve.bind(this)
				}
			})
		},
		
		declare: function() {
			Sheath.addDeclaredModule(this)
			Hook.moduleDeclared(this)
		},
		
		defer: function() {
			Assert.setFunc('Module.defer()').falsy(this.defined, 'This method must be called during the synchronous execution of the module factory.')
			this.deferring = true
			return this.interface // for chaining
		},

		define: function() {
			if (this.depsLeft > 0 || this.defined) return // there are more dependencies to resolve or we've already defined this module
			Sheath.analyzeMode ? this.saveDefinition() : this.implementDefine()
		},
		
		implementDefine: function() {
			Sheath.taskStart(this)
			var definition = this.factory.apply(this.interface, this.resolvedDeps)
			Sheath.taskEnd()
			
			this.saveDefinition(definition)
		},

		// Replace the array of deps with a map of depName -> depInfo.
		mapDeps: function() {
			var mappedDeps = {},
				rawDeps = []
			
			for (var i = 0; i < this.deps.length; i++) {
				var dep = new Dep(this.name, this.deps[i], i)
				
				Assert.falsy(mappedDeps[dep.name], 'Duplicate dependency detected.')
				
				rawDeps.push(dep.name)
				Sheath.addDependent(this, dep.name)
				Sheath.scheduleDepLoad(dep)
				mappedDeps[dep.name] = dep
			}
			this.rawDeps = rawDeps
			this.deps = mappedDeps
			this.resolveReadyDeps()
		},
		
		resolve: function(definition) {
			this.deferring = false
			this.saveDefinition(definition)
			return this.interface // for chaining
		},
		
		resolveDep: function(resolvedDep) {
			var depInfo = this.deps[resolvedDep.name]
			
			// If the dep is a fragment, find it. Otherwise, grab the resolvedDep's visage.
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
			this.defined = true
			if (typeof definition !== 'undefined') this.interface.exports = definition // a returned definition overrides any exports
			this.addAsDefinedModule()
		},
		
		get visage() {
			return this.interface.exports
		}
	}
	
	/*
		NamelessModule -- A module created via sheath.run() has less functionality than a normal module.
	*/
	var NamelessModule = function() {
		Module.apply(this, arguments)
	}
	NamelessModule.prototype = Object.create(Module.prototype, Sheath.toPropertyDescriptors({
		addAsDefinedModule: function() {},
		createInterface: function() {},
		declare: function() {},
		resolveExport: function() {},
		saveDefinition: function() {
			this.defined = true
		}
	}))
	
	/*
	
	*/
	var CustomModule = function(dep) {
		this.rawName = dep.rawName
		this.name = dep.name
		this.deps = []
		this.mods = dep.mods
	}
	CustomModule.prototype = Object.create(Module.prototype, Sheath.toPropertyDescriptors({
		applyMods: function(definition) {
			var nextMod = this.mods.shift()
			Sheath.mods[nextMod](this.rawName, this.resolveMod.bind(this), definition) // this is a mod's handle function signature
		},
		
		declare: function() {
			Sheath.addDeclaredModule(this)
		},
		
		implementDefine: function() {}, // no-op
		
		link: function(deps, factory) {
			this.linked = true
			
			// Restore some of the initial Module methods:
			this.implementDefine = Module.prototype.implementDefine
			Object.defineProperty(this, 'visage', Object.getOwnPropertyDescriptor(Module.prototype, 'visage'))
			
			Module.call(this, this.name, deps, factory) // basically re-initialize this module
			Hook.moduleDeclared(this)
			
			this.define() // attempt to define this module immediately, in case there are no deps
		},
		
		resolveMod: function(definition) {
			if (this.linked) return // this module has been converted into a normal module; nothing more for mods to do
			if (this.mods.length) return this.applyMods(definition) // recurse until there are no more mods
			
			this.definition = definition
			this.addAsDefinedModule()
		},
		
		get visage() {
			return this.definition
		}
	}))
	
	
	
	/*
		Loader -- An abstract class to define basic functionality that all loaders need.
	*/
	var Loader = function(moduleName, fileName, onload, sync) {
		this.moduleName = moduleName
		this.fileName = fileName
		this.onload = onload
		this.sync = sync
		this.isScript = fileName.slice(-3) === '.js'
		this.loadSuccessful = this.isScript ? this.scriptSuccessful.bind(this) : this.contentSuccessful.bind(this)
	}
	Loader.prototype = {
		abort: function() {
			// Defer condemning this dep until the current execution thread ends (in case its declaration occurs between now and then).
			setTimeout(function() {
				var data = Sheath.requestedFiles[this.fileName]
				this.loadSuccessful(data)
			}.bind(this))
		},
		
		contentSuccessful: function(content) {
			if (!this.onload) return // nothing to do
			
			if (content && typeof content !== 'string') {
				// It's an xhr.
				var status = content.target.status
				content = content.target.response
			}
			var args = [null, content]
			
			Sheath.requestedFiles[this.fileName] = content
			if (typeof status !== 'undefined' && status >= 400) args.shift() // there was an error; make the message the first argument
			this.onload.apply(null, args)
		},
		
		load: function() {
			if (this.loaded()) return this.abort()
			
			Sheath.requestedFiles[this.fileName] = ''
			return this.implementLoad()
		},
		
		loaded: function() {
			return typeof Sheath.requestedFiles[this.fileName] !== 'undefined'
		},
		
		scriptSuccessful: function() {
			if (this.onload) this.onload(null)
			
			Assert.moduleFoundInFile(this.moduleName)
		}
	}
	
	/*
		ClientLoader -- Implement asynchronous file loading for a browser environment.
	*/
	var ClientLoader = function() {
		Loader.apply(this, arguments)
	}
	ClientLoader.prototype = Object.create(Loader.prototype, Sheath.toPropertyDescriptors({
		attachHandlers: function(loadable) {
			loadable.onload = this.loadSuccessful
			Assert.loadNotFailed(this, loadable)
		},
		
		implementLoad: function() {
			return this.isScript ? this.loadScript() : this.loadOther()
		},
		
		loadOther: function() {
			var req = new Sheath.global.XMLHttpRequest()
			req.open('GET', this.fileName, !this.sync)
			this.attachHandlers(req)
			req.send()
		},
		
		loadScript: function() {
			var script = document.createElement('script')
			this.attachHandlers(script)
			script.async = !this.sync
			script.src = this.fileName
			document.head.appendChild(script)
		},
		
		loaded: function() {
			if (Loader.prototype.loaded.call(this)) return true
			var scripts = document && document.scripts || []
			
			return Array.prototype.filter.call(scripts, function(script) {
				return script.getAttribute('src') === this.fileName
			}.bind(this)).length
		}
	}))
	
	/*
		ServerLoader -- Implement asynchronous file loading for a server environment.
	*/
	var ServerLoader = function() {
		Loader.apply(this, arguments)
	}
	ServerLoader.prototype = Object.create(Loader.prototype, Sheath.toPropertyDescriptors({
		implementLoad: function() {
			ServerLoader.fs || (ServerLoader.fs = require('fs'))
			ServerLoader.vm || (ServerLoader.vm = require('vm'))
			ServerLoader.context || (ServerLoader.context = ServerLoader.vm.createContext({
				sheath: sheath,
				global: Sheath.global
			}))
			
			this.sync ? this.implementLoadSync() : this.implementLoadAsync()
		},
		
		implementLoadAsync: function() {
			ServerLoader.fs.readFile(this.fileName, this.loadComplete.bind(this))
		},
		
		implementLoadSync: function() {
			try {
				var contents = ServerLoader.fs.readFileSync(this.fileName)
				this.loadComplete(undefined, contents)
			} catch (ex) {
				this.loadComplete(ex)
			}
		},
		
		loadComplete: function(err, fileContents) {
			if (err) {
				Assert.warn('Failed to find file "' + this.fileName + '" on the server. Potential hang situation.')
				return this.onload && this.onload(err)
			}
			fileContents = fileContents.toString()
			Sheath.requestedFiles[this.fileName] = fileContents
			if (!this.isScript) return this.onload && this.onload(err, fileContents)
			
			ServerLoader.vm.runInContext(fileContents.toString(), ServerLoader.context)
			if (this.onload) this.onload(err)
		}
	}))
	
	
	
	
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
	*/
	var sheath = function(name, deps, factory) {
		if (typeof name === 'function') return name() // provide a sheath(() => {}) overload that just calls the function
		
		// Arg swapping -- deps is optional; if 'factory' doesn't exist, move it down.
		if (!factory) {
			factory = deps
			deps = []
		}
		Assert.setFunc('sheath()')
		Assert.string(name, 'Name')
		Assert.func(factory, 'Factory')
		if (typeof deps === 'string') deps = [deps] // if 'deps' is a string, make it the only dependency
		Assert.array(deps, 'If specified, deps must be a string or array of strings.')
		
		if (Sheath.configPhase) {
			Sheath.initialModules.push({name: name, deps: deps, factory: factory})
			return sheath // for chaining
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
		Assert.setFunc('sheath.config()')
		if (typeof key === 'string') {
			Assert.validConfigSetting(key)
			return sheath.config[key](val)
		}
		Assert.object(key, 'Key must be a string or an object of [config setting]->[value] pairs.')
		
		Object.keys(key).forEach(function(prop) {
			Assert.validConfigSetting(prop)
			sheath.config[prop](key[prop])
		})
		return sheath.config
	}
	
	
	/*
		sheath.config.async() -- A getter/setter to see/define the status of the async loader.
		Pass true to activate async loading, false to deactivate.
		Async loading is turned on by default.
	*/
	sheath.config.async = function(val) {
		if (typeof val === 'undefined') return Sheath.asyncEnabled
		Assert.setFunc('sheath.config.async()').configPhase()

		Sheath.asyncEnabled = Boolean(val)
		return sheath.config // for chaining
	}
	
	
	/*
		sheath.config.asyncResolver(function) -- The default async filename resolver doesn't do much. Use this guy to beef it up.
	*/
	sheath.config.asyncResolver = function(newResolver) {
		if (!newResolver) return Sheath.asyncResolver
		Assert.setFunc('sheath.config.asyncResolver()')
		Assert.configPhase()
		Assert.func(newResolver, 'asyncResolver')

		Sheath.asyncResolver = newResolver
		return sheath.config // for chaining
	}
	
	
	/*
		sheath.config.baseModel() -- A getter/setter for the baseModel to be used by sheath.model() as the default parent prototype.
	*/
	sheath.config.baseModel = function(baseModel) {
		if (typeof baseModel === 'undefined') return Sheath.baseModel

		Assert.setFunc('sheath.config.baseModel()').configPhase()
		Assert.object(baseModel, 'Base model must be an object or null.')
		
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

		Assert.setFunc('sheath.config.baseObject()').configPhase()
		Assert.object(baseObject, 'Base object must be an object or null.')

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
		Assert.setFunc('sheath.config.emulateBrowser()').configPhase()
		
		inBrowser = Boolean(val)
		return sheath.config // for chaining
	}
	
	
	/*
		sheath.config.mode() -- A getter/setter to get the status of and enable/disable advanced debugging/analysis tools.
	*/
	sheath.config.mode = function(val) {
		if (typeof val === 'undefined') return Sheath.mode
		
		Assert.setFunc('sheath.config.mode()').configPhase()
		Assert.validMode(val)
		
		Sheath.mode = val
		return sheath.config // for chaining
	}
	
	
	/*
		sheath.const() -- Use to declare/fetch universal constants -- immutable values that the whole app should have access to.
	*/
	sheath.const = function(key, val) {
		if (typeof key === 'string') {
			if (typeof val === 'undefined') return Sheath.constants[key]
			
			Sheath.defineConst(key, val)
			return sheath // for chaining
		}
		Assert.setFunc('sheath.const()').object(key, 'Please specify a single key and value or an object of key-value pairs.')
		Object.keys(key).forEach(function(prop) {
			Sheath.defineConst(prop, key[prop])
		})
		return sheath // for chaining
	}
	
	
	/*
		sheath.current() -- Get the name of the module currently being defined. Use to reduce duplication.
	*/
	sheath.current = function() {
		Assert.task()
		return Sheath.tasks.length ? Sheath.tasks[Sheath.tasks.length - 1].interface : null
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
		If no moduleName is passed, find all trees of all app-level modules (modules that have no dependents).
	*/
	sheath.forest = function(moduleName) {
		if (typeof moduleName === 'string') {
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
		This means mutatable properties (objects and extensions thereof) can be set in the init function, avoiding copying pointers across multiple instances of the object.
	*/
	sheath.instance = function(parent, model) {
		sheath.instance.active = true
		var Model = sheath.model(parent, model)
		sheath.instance.active = false
		return new Model()
	}
	
	
	/*
		sheath.load() -- Load a file. Behavior is different for .js files and non-.js files
		
	*/
	sheath.load = function(fileName, onload, sync) {
		Assert.setFunc('sheath.load()')
		Assert.string(fileName, 'Filename')
		if (onload) Assert.func(onload, 'Callback')
		
		Sheath.asyncLoaderFactory('', fileName, onload, sync)
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
		Assert.setFunc(sheath.instance.active ? 'sheath.instance()' : 'sheath.model()')
		Assert.notConfigPhase()

		// Arg swapping -- 'parent' is optional; if 'model' doesn't exist, move it down.
		if (!model) {
			model = parent
			parent = Sheath.baseModel
		}

		// Make sure model, parent (if given), and model.init (if given) are valid.
		Assert.object(model, 'Model')
		if (parent) Assert.func(parent, 'Parent')
		if (model.init) Assert.func(model.init, 'Model "init" property must be a function.')

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
		Assert.setFunc('sheath.object()')
		Assert.notConfigPhase()

		// Arg swapping -- 'parent' is optional; if 'object' doesn't exist, move it down.
		if (!object) {
			object = parent || {} // set it to an empty object if nothing was passed in
			parent = Sheath.baseObject
		}

		// Make sure object and parent (if given) are valid.
		Assert.object(object, 'Object')
		if (parent) Assert.object(parent, 'Parent')

		// Make the parent the object's prototype.
		object = Object.create(parent || null, Sheath.toPropertyDescriptors(object))

		return object
	}
	
	
	/*
		sheath.onModuleDeclared() -- Register a listener that will be called every time a module is declared.
		A hook.
	*/
	sheath.onModuleDeclared = function(listener) {
		Assert.setFunc('sheath.onModuleDeclared()')
		Assert.configPhase('Listeners can only be registered during the config phase.')
		Assert.func(listener, 'Listener')
		
		Hook.moduleDeclaredListeners.push(listener)
		return sheath // for chaining
	}
	
	
	/*
		sheath.onModuleDefined() -- Register a listener that will be called every time a module is defined.
		A hook.
	*/
	sheath.onModuleDefined = function(listener) {
		Assert.setFunc('sheath.onModuleDefined()')
		Assert.configPhase('Listeners can only be registered during the config phase.')
		Assert.func(listener, 'Listener')
		
		Hook.moduleDefinedListeners.push(listener)
		return sheath // for chaining
	}
	
	
	/*
		sheath.phase() -- A debugging utility. This will return the life phase that Sheath is currently in.
		Use this to familiarize yourself with Sheath's lifecycle.
		An analysis tool.
	*/
	sheath.phase = function() {
		return Sheath.phase
	}


	/*
		sheath.registerMod() -- Register a modifier.
		Modifiers allow for the existence of custom module types.
		A modifier can define behavior for the declaration, loading, definition, and injection of a custom module type.
	*/
	sheath.registerMod = function(name, factory) {
		Assert.setFunc('sheath.registerMod()')
		Assert.string(name, 'Name')
		Assert.noNamespaceCollision(name) // the new mod will share the sheath namespace, so make sure it doesn't conflict
		Assert.func(factory, 'Factory')
		
		// Call the factory to set up the modifier.
		var mod = factory(Sheath.link.bind(Sheath))
		
		Assert.object(mod, 'Mod factory for mod "' + name + '" failed to return an object.')
		
		Sheath.incorporateMod(name, mod)
		return sheath // for chaining
	}
	
	
	/*
		sheath.reset() -- Clear all modules and all data of every kind (except mods) and start over. (Not available in production builds).
	*/
	sheath.reset = function() {
		Hook.moduleDeclaredListeners = []
		Sheath.asyncEnabled = true
		Sheath.constants = {}
		Sheath.declaredModules = {}
		Sheath.definedModules = {}
		Sheath.dependents = {}
		Sheath.initialModules = []
		Sheath.linkedModules = {}
		Sheath.mode = 'production'
		
		// A reset doesn't clear mods, but calls each mod's (optional) reset method, allowing them to clear themselves.
		Object.keys(Sheath.mods).forEach(function(modName) {
			if (sheath[modName] && typeof sheath[modName].reset === 'function') sheath[modName].reset()
		})
		Sheath.phase = 'config'
		setTimeout(advancePhases)
		Sheath.requestedFiles = {}
		Sheath.requestedModules = {}
		Sheath.tasks = []
		return sheath // for chaining
	}
	
	
	/*
		sheath.run() -- Run some code that leverages Sheath's dependency injection, but without declaring a module.
		Useful for circumventing circular dependencies.
		The 'deps' arg is optional, so this can also be used to defer execution until after the config phase.
	*/
	sheath.run = function(deps, factory) {
		// Arg swapping -- deps is optional; if 'factory' doesn't exist, move it down.
		if (!factory) {
			factory = deps
			deps = []
		}
		Assert.setFunc('sheath.run()')
		Assert.func(factory, 'Factory')
		if (typeof deps === 'string') deps = [deps] // if 'deps' is a string, make it the only dependency
		Assert.array(deps, 'If specified, deps must be a string or array of strings.')
		
		if (Sheath.configPhase) {
			Sheath.initialModules.push({name: false, deps: deps, factory: factory})
			return
		}
		Sheath.moduleFactory(false, deps, factory)
		return sheath // for chaining
	}
	
	
	/*
		sheath.store() -- Create a data-store on an array. Exposes all common, non-mutating methods of Array.prototype.
	*/
	var nonMutating = ['every', 'filter', 'forEach', 'indexOf', 'join', 'lastIndexOf', 'map', 'reduce', 'reduceRight', 'slice', 'some']
	sheath.store = function(arr, props) {
		Assert.setFunc('sheath.store()')
		Assert.array(arr, 'Collection')
		if (props) Assert.object(props, 'Api')
		
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
		sheath.lib() -- An easy way to encapsulate/incorporate third-party libraries.
		An example of an unprefixed modifier.
	*/
	sheath.registerMod('lib', function() {
		var libs = []
		
		var api = function(moduleName, globalName, fileName) {
			Assert.setFunc('sheath.lib()')
			Assert.string(moduleName, 'Name')
			
			// Arg swapping -- if 'globalName' is a url, it isn't a valid identifier and is actually the filename; move 'fileName' down.
			if (Sheath.isUrl(globalName)) {
				fileName = globalName
				globalName = undefined
			}
			if (!globalName) globalName = moduleName // allow overload: sheath.lib('Backbone')
			
			Assert.string(globalName, 'Global identifier must be a string.')
			if (fileName) Assert.string(fileName, 'Filename')
			
			var lib = new Lib(moduleName, globalName, fileName)
			lib.declare()
			libs.push(lib)
			return api // for chaining
		}
		
		/*
			sheath.lib.names() -- Get the names of all lib modules.
		*/
		api.names = function() {
			return libs.map(function(lib) {
				return lib.name
			})
		}
		
		/*
			sheath.lib.files() -- Get the files of all lib modules.
		*/
		api.files = function() {
			var files = libs.map(function(lib) {
				return lib.fileName
			}).filter(function(fileName) {
				return fileName
			})
			return files
		}
		
		api.reset = function() {
			libs = []
		}
		
		var Lib = function(moduleName, globalName, fileName) {
			this.name = moduleName
			this.globalName = globalName
			this.fileName = fileName
		}
		Lib.prototype = {
			declare: function() {
				sheath(this.name, this.factory.bind(this))
			},
			
			factory: function() {
				var module = sheath.current()
				
				// Don't defer this module if we don't have to (if the lib is already loaded).
				if (!this.fileName || this.resolveGlobalName()) return this.onload()
				
				module.defer()
				sheath.load(this.fileName, this.onload.bind(this, module), true)
			},
			
			onload: function(module, err) {
				var definition = this.resolveGlobalName() // grab the lib's api off the global scope
				Assert.libLoaded(err, definition, this.name, this.globalName)
				
				// Account for sync and async resolution.
				return module ? module.resolve(definition) : definition
			},
			
			resolveGlobalName: function(context, nodes) {
				if (!nodes) {
					context = Sheath.global
					nodes = this.globalName.split('.')
				}
				if (!context) return
				if (!nodes.length) return context
				
				var nextNode = nodes.shift()
				return this.resolveGlobalName(context[nextNode], nodes)
			}
		}
		
		var handle = function(name, resolve, previous) {
			Assert.setFunc('Lib Modifier')
			Assert.error(Error, 'Prefixed dependencies (e.g. "lib!MyLib") are not supported. Use sheath.lib() during the config phase to create a lib, then include it as an unprefixed dependency.')
		}
		
		return {
			api: api,
			handle: handle
		}
	})
	
	
	/*
		sheath.text() -- An easy way to inject content as modules--e.g. for underscore/handlebars templating.
		An example of a prefixed modifier.
	*/
	sheath.registerMod('text', function() {
		var textModules = {}
		var loading = {}
		
		var api = function(name, content) {
			Assert.setFunc('sheath.text()')
			Assert.string(name, 'Name')
			if (typeof textModules[name] !== 'undefined') {
				if (typeof content === 'undefined') return textModules[name]
				Assert.error(Error, 'A text module with name "' + name + '" already exists.')
			}
			
			resolve(name, content)
		}
		api.reset = function() {
			textModules = {}
			loading = {}
		}
		
		var handle = function(name, resolve, previous) {
			// Resolve immediately if we've already loaded this text module or a chained mod gave us a previous definition.
			if (typeof previous !== 'undefined') return resolve(previous)
			if (typeof textModules[name] !== 'undefined')  return resolve(textModules[name])
			
			// If we've already requested this text module, add this resolver to that module's resolver list.
			if (loading[name]) return loading[name].push(resolve)
			
			loading[name] = [resolve]
			sheath.load(name, onload.bind(null, name))
		}
		
		var onload = function(name, err, content) {
			if (typeof textModules[name] !== 'undefined') return // the text module was defined in the .js file
			if (typeof content !== 'undefined') return resolve(name, content)
		}
		
		var resolve = function(name, content) {
			textModules[name] = content
			
			var resolverList = loading[name]
			if (!resolverList || !resolverList.length) return // nothing to resolve
			
			while (resolverList.length) {
				resolverList.shift()(content)
			}
			loading[name] = undefined
		}
		
		return {
			api: api,
			handle: handle
		}
	})
	
	
	
	/*
		Once all the initial scripts have been loaded:
		Run the sync phase, then:
		Turn on asychronous loading and request any not-yet-declared modules.
	*/
	function advancePhases() {
		Sheath.toPhase('sync')
		
		// setTimeout -- allow any deferred tasks set during the sync phase to complete before advancing to the async phase
		setTimeout(Sheath.toPhase.bind(Sheath, 'async'))
	}
	inBrowser
		? (window.onload = advancePhases)
		: setTimeout(advancePhases)
	
	return sheath
}))
