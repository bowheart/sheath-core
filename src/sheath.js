/*
	Sheath.js
	Another library by Joshua Claunch -- https://github.com/bowheart
*/
(function(outside, inBrowser) {
	var asyncActive = inBrowser // utilize async loading if we're in a browser environment
	
	/*
		asyncResolver() -- takes a module's name and returns the filename--the `src` attribute of an async <script> tag to load this module.
		This is just the default! It is meant to be overridden using sheath.asyncResolver() (below).
	*/
	var asyncResolver = function(module) {
		// The default async filename resolver just assumes that the module name is the filepath minus the '.js' extension.
		return module + '.js'
	}
	
	/*
		modules -- a private utility used by our sheath() function (below) to keep track of all defined modules.
		Moves all modules through this process:
		[declaration received] -> [added to 'toLoad' list] -> [dependencies loaded] -> [definitionFunction called] -> [added to 'loaded' list]
	*/
	var modules = {
		
		// add() -- A new module was defined! If it's deps are already met, load it, otherwise add it to the list (this.toLoad)
		add: function(module) {
			if (module.name) this.declaredModules.push(module.name)
			if (this.check(module)) return
			
			this.toLoad.push(module)
			if (this.asyncMode) this.loadAsync(module.deps)
		},
		
		// check(module) -- Sees if this module's deps are met. If so, loads it.
		check: function(module, index) {
			for (var i = 0; i < module.deps.length; i++) {
				var dep = module.deps[i]
				if (!this.loaded[dep]) return false // we found an unloaded dep; this module isn't ready
			}
			if (typeof index !== 'undefined') this.toLoad.splice(index, 1)
			
			this.load(module)
			return true
		},
		
		// digest() -- Loops through all modules toLoad and sees if their deps are met. If so, loads them.
		digest: function() {
			for (var i = 0; i < this.toLoad.length; i++) {
				var module = this.toLoad[i]
				if (this.check(module, i)) return
			}
		},
		
		// load() -- Compiles the list of deps of 'module' and passes them into the module definition function.
		// Also moves this module from 'toLoad' to 'loaded' so other modules that require this one can use it.
		load: function(module) {
			var deps = module.deps.map(function(dep) {
				return this.loaded[dep]
			}.bind(this))
			
			var definition = module.defFunc.apply(null, deps) || {} // TODO: add a way to specify the context of the defFunc
			if (!module.name) return // none of the rest applies to nameless modules (modules added via sheath.run())
			
			if (this.loaded[module.name]) throw new Error('Sheath.js Error: Multiple modules with the same name found. Name: "' + module.name + '"')
			
			this.loaded[module.name] = definition
			this.digest() // now that this module's loaded, digest to see if this module resolves any other module's last dep
		},
		
		// loadAsync() -- Creates a <script> tag for each of the module names passed in (if one hasn't been created).
		loadAsync: function(names) {
			if (!asyncActive) return
			if (!Array.isArray(names)) names = [names]
			
			for (var i = 0; i < names.length; i++) {
				var name = names[i],
					filename = asyncResolver(name)
				
				if (names.filter.call(document.scripts, function(script) { return script.getAttribute('src') === filename }).length) {
					continue // this script has already been loaded
				}
				var script = document.createElement('script')
				
				script.src = filename
				document.body.appendChild(script)
			}
		},
		
		// undeclaredModules() -- Returns the list of all modules that have been required but never declared.
		undeclaredModules: function() {
			var declaredModules = this.declaredModules
			
			return this.toLoad.map(function(module) {
				return module.deps
			}).reduce(function(mem, nextDeps) {
				for (var i = 0; i < nextDeps.length; i++) {
					var nextDep = nextDeps[i]
					
					if (!~mem.indexOf(nextDep) && !~declaredModules.indexOf(nextDep)) mem.push(nextDep)
				}
				return mem
			}, [])
		},
		
		asyncMode: false, // determines if we'll load any new deps asynchronously; will be turned on once all initial scripts are loaded
		declaredModules: [], // keeps track of all module declarations we've encountered throughout the lifetime of this app.
		loaded: {}, // the list of defined modules
		toLoad: [] // the list of declared modules whose dependencies are not yet met
	}
	
	// Turn all own properties of an object into their property descriptors
	var toPropertyDescriptors = function(obj) {
		var propertyDescriptors = {}
		Object.keys(obj).forEach(function(key) {
			propertyDescriptors[key] = Object.getOwnPropertyDescriptor(obj, key)
		})
		return propertyDescriptors
	}
	
	
	
	
	/*
		sheath() -- A utility for organized, encapsulated module definition and dependency injection.
		
		Parameters:
			name : string -- required -- The name of this module.
			deps : string | array -- optional -- The module or list of modules required by this module.
				Each of these must be the name of another module defined somewhere.
				If any dep in this list is not declared in the app and cannot be found by the async loader, the app will 'hang' (see below).
				These will be 'injected' into the defFunc.
			defFunc : function -- required -- The function that will be called to define this module.
				The parameters of this function will be this module's dependencies, in the order they were listed.
				Whatever is 'return'ed by this function will be injected into any modules that require this one.
	*/
	var sheath = outside.sheath = function(name, deps, defFunc) {
		// arg swapping -- deps is optional; if 'defFunc' doesn't exist, move it down
		if (!defFunc) {
			defFunc = deps
			deps = []
		}
		if (typeof deps === 'string') deps = [deps] // if 'deps' is a string, make it the only dependency
		modules.add({name: name, deps: deps, defFunc: defFunc})
	}
	
	
	/*
		sheath.async() / sheath.async(bool) -- a getter/setter to see/define the status of the async loader.
		Pass true to activate async loading, false to deactivate.
		Async loading is turned on by default.
	*/
	sheath.async = function(val) {
		if (typeof val === 'undefined') return asyncActive
		return asyncActive = Boolean(val)
	}
	
	
	/*
		sheath.asyncResolver(function) -- the default async filename resolver doesn't do much. Use this guy to beef it up.
	*/
	sheath.asyncResolver = function(newResolver) {
		if (typeof newResolver !== 'function') throw new TypeError('Sheath.js Error: Custom asyncResolver must be a function')
		
		asyncResolver = newResolver
	}
	
	
	/*
		sheath.run() -- run some code that leverages Sheath's dependency injection, but without declaring a module.
		The 'deps' arg is optional, so this can also be used for just arbitrary encapsulation -- replacing an IIFE, for example.
	*/
	sheath.run = function(deps, func) {
		// arg swapping -- deps is optional; if 'func' doesn't exist, move it down.
		if (!func) {
			func = deps
			deps = []
		}
		if (typeof deps === 'string') deps = [deps] // if 'deps' is a string, make it the only dependency
		modules.add({deps: deps, defFunc: func})
	}
	
	
	/*
		sheath.model() -- An easy interface for declaring JavaScript 'classes' with inheritance.
		
		Params:
			parent : object|function -- optional -- The prototype, or function whose prototype this model will inherit.
			model : object -- required -- The class definition. If the object has an 'init()' property (optional), it will become the class constructor.
	*/
	sheath.model = function(parent, model) {
		// Arg swapping -- 'parent' is optional; if 'model' doesn't exist, move it down.
		if (!model) {
			model = parent
			parent = custom.ModelBase // it's fine if custom.ModelBase is undefined
		}
		var parentPrototype = typeof parent === 'function' ? parent.prototype : parent
		
		// Make sure the model param is valid.
		if (typeof model !== 'object') throw new TypeError('Sheath.js Error: Model must be an object')
		
		// Make sure the parent param is valid, if it was given.
		if (parent && !~['function', 'object'].indexOf(typeof parent)) {
			throw new TypeError('Sheath.js Error: Parent must be a constructor function or an object')
		}
		
		// Use the init() property of the model as the constructor (if it exists), otherwise use the parent's (if there's a parent)
		var constructor = model.init || parent && parentPrototype.init && function() {
			return parentPrototype.init.apply(this, arguments)
		} || new Function()
		
		// Implement the inheritance (if user gave a parent model) and make the rest of the model the prototype
		constructor.prototype = Object.create(parentPrototype, toPropertyDescriptors(model))
		
		return constructor
	}
	
	
	/*
		sheath.object() -- An easy interface for declaring JavaScript objects with custom and inheriting prototypes.
		
		Params:
			parent : object -- optional -- The prototype object from which this object will inherit.
			object : object -- required -- The new object you want created.
	*/
	sheath.object = function(parent, object) {
		// Arg swapping -- 'parent' is optional; if 'object' doesn't exist, move it down.
		if (!object) {
			object = parent
			parent = custom.ObjectBase // it's fine if custom.ObjectBase is undefined
		}
		
		// Make sure the object param is valid.
		if (typeof object !== 'object') throw new TypeError('sheath.object() error: object must be an object')
		
		// Make sure the parent param is valid, if it was given.
		if (parent && typeof parent !== 'object') {
			throw new TypeError('sheath.object() error: parent must be an object')
		}
		
		// Make the parent the object's prototype.
		if (parent) object = Object.create(parent, toPropertyDescriptors(object))
		
		return object
	}
	
	
	/*
		sheath.waitingOn() -- returns the names of all the modules the app is waiting on.
		These are modules that have been listed as dependencies of other modules, but that haven't been declared yet.
		Call this from the console when you suspect the app is hanging.
	*/
	sheath.waitingOn = function() {
		return modules.undeclaredModules()
	}
	
	
	// Once all the initial scripts have been loaded, turn on asychronous loading and load any not-yet-declared modules.
	window.onload = function() {
		modules.asyncMode = true
		modules.loadAsync(modules.undeclaredModules())
	}
})(window || typeof module === 'object' && typeof module.exports === 'object' && module.exports || this, typeof window === 'object')
