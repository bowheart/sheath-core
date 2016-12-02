# Sheath.js

Sheath is a utility library for modular applications. It provides a clean, overly simplistic interface for defining modules. This includes dependency injection and asynchronous script loading &ndash; replacing async libraries such as RequireJS.

Sheath simplifies the application development process. It is specifically designed for use with MVC frameworks such as Backbone, React, and Mithril, but can also be used without a framework.

Sheath abstracts away the details of your module-web &ndash; you never have to worry about when/where a module's dependencies are defined. It also provides utilities for easily defining common types of modules (models/classes, objects, config, data-stores, etc).

Basically, if you're wanting to create a modular application, Sheath is for you.

Sheath is the module library.

## The Basics

### A simple example

Let's create a module.

```javascript
sheath('dagger', function() {
	return 'a dagger'
})
```

Simple as that. Let's break down what happened here:

- We *declared* a module named 'dagger'.
- Sheath called our function. This *defined* our module.
- We exposed the string 'a dagger' as our module's *visage*.

Alright. Cool, I guess. Now what was the point of that?

Let's create another module:

```javascript
sheath('assassin', 'dagger', function(dagger) {
	return 'A deadly assassin. Weapon: ' + dagger
})
```

Let's break this one down:

- We declared a module named 'assassin' with one dependency, 'dagger'.
- Sheath ensured that the 'dagger' module was loaded before:
- Sheath called our function, passing the dagger module's visage as the first argument. This defined our module.
- We exposed a new string concatenated with the dagger module's visage as our module's visage.

Every module goes through this basic life cycle.

> Tip: A module can be anything! Feel free to wrap every model, component, utility function, etc in its own module.

### Implementing Async Loading



## Method API

### sheath()

Signature:
```javascript
sheath(name : string, dependencies : string|array, definition : function)
```
Overloads:
```javascript
sheath(name : string, definition : function)
```

This is how you define a module.

Arguments:

**name** : string &ndash; *required* &ndash; This module's name. Used to identify this module for dependents and async loading. Can be any arbitrary string, e.g. `'my-module'` or `'namespace::submodule'`. You get to decide your naming conventions.

**dependencies** : string|array &ndash; *optional* &ndash; The dependency or dependencies of this module given as a string or list of strings that match the names of other modules you've created or will create.

**definition** : function &ndash; *required* &ndash; A function that encapsulates this module's definition. Once all dependencies of this module have been loaded, this function will be called and passed the loaded dependencies in order as they appeared in the dependencies list.

Example:

```javascript
sheath('Weapon', function() {
	return class Weapon {
		get damage() {
			return this._damage || 0
		}
	}
})
```

```javascript
sheath('Sword', 'Weapon', function(Weapon) {
	return class Sword extends Weapon {
		_damage: 10
	}
})
```


### sheath.asyncResolver()

Signature:
```javascript
sheath.asyncResolver(newResolver : function)
```

The default async filename resolver
This defines a mapping of module names to file paths.
When the module loader is in async mode, it will call this function to get the value of each async script's `src` attribute.
It will pass the module's name (e.g. `core`) and expect the file path to that module's location on the server (e.g. `modules/core/core.js`).

#### How do I implement it?

Define a function that takes a string and returns a string. Pass that function to `sheath.asyncResolver()`:

```javascript
// Take a module name (e.g. 'food.Pizza') and find the file path (e.g. 'modules/food/models/Pizza.js')
sheath.asyncResolver(function(name) {
	var nodes = name.split('.')
	var file = nodes.pop() // get 'Pizza' from 'food.Pizza'
	return 'modules/' + nodes.join('/') + '/' + (file[0].toLowerCase() !== file[0] ? 'models/' : '') + file + '.js'
})
```


### sheath.waitingOn()

A debugging utility.
Call this from the console if you suspect the app is hanging.
It will tell you the names of all the modules the app is waiting on.
Look through them and see if any shouldn't be there.
If they all look right, you probably have a circular dependency.





















#### So what's so cool about it?

- The definition function creates a mandatory closure around all modules.
This keeps stuff off the global scope.
This gives you private space for housing whatever data your module might need to keep away from the rest of the app.
This lets you expose whatever you want to any modules requiring your module.

- It's asynchronous! Lazy-loading scripts is really easy to manage.

- The asynchrony allows modules to be defined in any order.
This is a layer of abstraction for you! You never have to manually ensure that something has been defined before using it.

- It's modular.
The spider-webby nature of modular systems earns it coolness points.
It doesn't limit you at all; a module can be anything you want.
It encourages good code structure, helping you think, 'What am I doing with this piece of code?'
This helps you keep the Single Responsibility Principle, and who knows what other good things.

- It's organized.
A large application can turn into a big jumble of objects and helpers and config and your precious time really fast.
Going modular (or 'sheathing') keeps everything in its own place, yet globally accessible (but not global).


#### How do I use it?

Any way you want. A module can return anything, after all. Here are some common module types I've noticed myself using:

- config-module -- Returns a `const` or an object with unwritable properties.
Use these to define global configuration for your app--stuff all modules should know about.

- data-store -- An array or object you want to be able to access/modify in multiple places.
Usually you'll want to use a factory for this.

- factory -- An advanced data-store that keeps the data itself private, and exposes some accessor/helper methods to dependants.

- component -- A mithril thing. This is an object with a required 'view' function and optional 'controller' function.

- model -- A 'class' definition. A model returns its constructor function.

- utility-module -- A helpful function or an object with helpful stuff on it. Something you want multiple modules to access.

- combinations -- Not every module must have a strict type. You can combine any of the above however you want.


#### No... HOW do I use it?

Oh. Like this:

```javascript
sheath('dependency', function() {
	return 'You got me'
})

sheath('dependant', 'dependency', function(dependency) {
	console.log(dependency) // <- 'You got me'
})
```

A contrived example, of course.


#### So how SHOULD I use it?

- There should be an 'app' and a 'core' module in every Mithril-x platform.
Core contains basic functionality used by the rest of the app.
App takes our custom modules and uses them to kick-start the application.
This gives us a module-web with this basic form:

```javascript
/*
     O core
    /|\
   O O O custom modules
    \|/
     O app
*/
```

- Come up with naming conventions such as "all models should be PascalCase."
These are arbitrary.
It doesn't matter what your naming conventions are, but a standard will make your app more predictable.
This allows you to implement lazy-loading based on a module's name.
This also prevent hang.


#### Wait, what's HANG?

Hang means the app is waiting for a module (dependency) to be defined.
Since the module loader is meant to work in an asynchronous environment, it will just wait and wait for that module.
This can be hard to debug (though sheath.waitingOn() can help), but you should know what causes it:

1. A module requiring a non-existent module. The non-existent module is either never defined or not getting loaded.
2. A circular dependency. These are easy to avoid, but sometimes tricky to spot.
These are usually solved by keeping strictly to the Single Responsibility Principle;
separate the functionality that both modules need into a separate module that both require.
