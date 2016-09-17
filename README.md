# Mithril-X

### So what's so cool about it?

- The defFunc creates a mandatory closure around all modules.
This keeps stuff off the global scope.
This gives you private space for housing whatever data your module might need to keep away from the rest of the app.
This lets you expose whatever you want to any modules requiring your module.

- It's asynchronous! Lazy-loading scripts is really easy to manage.

- The asynchrony allows modules to be defined in any order.
This is a layer of abstraction for you! You never have to manually ensure that something has been defined before using it.

- It's modular.
The spider-webby nature of modular systems earns it coolness points.
It doesn't limit you at all; a module can be anything you want.
It encourages good code structure, helping you think, 'What am I doing with this piece of code?'.
	This helps you keep the Single Responsibility Principle, and who knows what other good things.

- It's organized.
A mithril app can turn into a big jumble of objects really fast in a big application.
This keeps everything in its own place, yet globally accessible (but not global)


### How do I use it?

Any way you want. A module can return anything, after all. Here are some common module types I've noticed myself using:

- config-module -- Returns a `const` or an object of unwritable properties.
Use these to define global configuration for your app--stuff all modules should know about.

- data-store -- An array or object you want to be able to access/modify in multiple places.
Usually you'll want to use a factory for this.

- factory -- An advanced data-store that keeps the data itself private, and exposes some accessor/helper methods to dependants.

- component -- A mithril thing. This is an object with a required 'view' function and optional 'controller' function.

- model -- A 'class' definition. A model returns its constructor function.

- utility-module -- A helpful function or an object with helpful stuff on it. Something you want multiple modules to access.

- combinations -- Not every module must have a strict type. You can combine any of the above however you want.


### No... HOW do I use it?

Oh. Like this:

```javascript
m.define('dependency', function() {
	return 'You got me'
})

m.define('dependant', 'dependency', function(dependency) {
	console.log(dependency) // <- 'You got me'
})
```

A contrived example, of course.


### So how SHOULD I use it?

- Come up with naming conventions such as "all models should be PascalCase."
These are arbitrary.
It doesn't matter what your naming conventions are, but a standard will make your app more predictable.
This allows you to implement lazy-loading based on a module's name.
This also prevent hang.


### Wait, what's HANG?

Hang means the app is waiting for a module (dependency) to be defined.
Since the module loader is meant to work in an asynchronous environment, it will just wait and wait for that module.
This can be hard to debug (though m.hangInfo() can help), but you should know what causes it:

1. A module requiring a non-existent module. The non-existent module is either never defined or not getting loaded.
2. A circular dependency. These are easy to avoid, but sometimes tricky to spot.
These are usually solved by keeping strictly to the Single Responsibility Principle;
separate the functionality that both modules need into a separate module that both require.
