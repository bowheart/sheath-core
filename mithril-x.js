/*
	Mithril-x is just an add-on to mithril.js
*/
(function() {
	// modules -- a private object used by our m.define() function (below)
	var modules = {
		
		// add() -- A new module was defined! If it's deps are already met, load it, otherwise add it to the list (this.toLoad)
		add: function(module) {
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
		// Also moves this module from 'toLoad' to 'loaded' so other modules that require this one can know that it's loaded.
		load: function(module) {
			var deps = module.deps.map(function(dep) {
				return this.loaded[dep]
			}.bind(this))
			this.loaded[module.name] = module.defFunc.apply(module.defFunc, deps) || {}
			this.digest() // now that this module's loaded, digest to see if this module resolves any other module's last dep
		},
		
		// loadAsync() -- Creates a <script> tag for each of the module names passed in (if one hasn't been created).
		loadAsync: function(names) {
			if (!Array.isArray(names)) names = [names]
			
			for (var i = 0; i < names.length; i++) {
				var name = names[i]
				if (~Object.keys(this.loaded).indexOf(name)) continue
				
				var filename = m.moduleFile(name),
					scriptExists = [].filter.call(document.scripts, function(script) { return script.getAttribute('src') === filename }).length
				
				if (scriptExists) continue // this script has already been loaded
				
				var script = document.createElement('script')
				script.async = true
				script.src = filename
				document.body.appendChild(script)
			}
		},
		
		// undefinedModules() -- Returns the list of all modules that have been required but never defined.
		undefinedModules: function() {
			var definedModules = Object.keys(this.loaded).concat(this.toLoad.map(function(module) {
				return module.name
			}))
			
			return this.toLoad.map(function(module) {
				return module.deps
			}).reduce(function(mem, nextDeps) {
				for (var i = 0; i < nextDeps.length; i++) {
					var nextDep = nextDeps[i]
					
					if (!~mem.indexOf(nextDep) && !~definedModules.indexOf(nextDep)) mem.push(nextDep)
				}
				return mem
			}, [])
		},
		
		asyncMode: false, // determines if we'll load any new deps asynchronously; will be turned on once all initial scripts are loaded
		loaded: {}, // the list of defined modules
		toLoad: [] // the list of modules whose dependencies are not yet met
	}
	
	
	/*
		m.moduleFile() -- takes a module's name and returns the filename--the `src` attribute of an async <script> tag to load this module.
		This is just the default! It is meant to be overridden.
	*/
	m.moduleFile = function(name) {
		return name + '/' + name.split('/').filter(function(node) { return node }).pop() + '.js'
	}
	
	
	/*
		m.define() -- A utility for organized, encapsulated module definition and dependency injection.
		
		Parameters:
			name -- required -- string -- The name of this module.
			deps -- optional -- string | array -- The module or list of modules required by this module.
				Each of these must be the name of another module defined somewhere.
				If any dep in this list is not defined in the app, the app will 'hang' (see below).
				These will be 'injected' into the defFunc.
			defFunc -- required -- function -- The function that will be called to define this module.
				The parameters of this function will be this module's dependencies, in the order they were listed.
				Whatever is 'return'ed by this function will be injected into any modules that require this one.
	*/
	m.define = function(name, deps, defFunc) {
		// arg swapping -- deps is optional; if 'defFunc' doesn't exist, move it down
		if (!defFunc) {
			defFunc = deps
			deps = []
		}
		if (typeof deps === 'string') deps = [deps] // if 'deps' is a string, make it the only dependency
		modules.add({name: name, deps: deps, defFunc: defFunc})
	}
	
	/*
		m.hangInfo()
		This can be helpful when you suspect the app is hanging.
		It will tell you the names of all the modules the app is waiting on.
		Look through them and see if any shouldn't be there.
		If they all look right, you probably have a circular dependency.
	*/
	m.hangInfo = function() {
		return 'Waiting for modules: ' + modules.undefinedModules().join(', ')
	}
	
	
	// Once all the initial scripts have been loaded, turn on asychronous loading and load any not-yet-defined modules.
	window.onload = function() {
		modules.asyncMode = true
		modules.loadAsync(modules.undefinedModules())
	}
})()
