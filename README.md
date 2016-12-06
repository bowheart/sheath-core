# Sheath.js

Sheath is a utility library for modular applications, specifically designed for use with MVC frameworks such as Backbone, React, and Mithril, but can also be used without a framework. It provides a clean, overly simplistic interface for defining modules. This includes dependency injection and asynchronous script loading. It also provides utilities for easily defining common types of modules (models/classes, objects, config, data-stores, etc).

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
- We exposed the string 'a dagger' as our module's *visage*. The visage is the public face of our module &ndash; it's what will get injected into dependents

Alright. Cool, I guess. Now what was the point of that?

Let's create another module:

```javascript
sheath('assassin', ['dagger'], function(dagger) {
	return 'A deadly assassin. Weapon: ' + dagger
})
```

Let's break this one down:

- We declared a module named 'assassin' with one dependency, 'dagger'.
- Sheath ensured that the 'dagger' module was loaded before:
- Sheath called our function, passing ("injecting") the dagger module's visage as the first argument. This defined our module.
- We exposed a new string concatenated with the dagger module's visage as our module's visage.

Every module goes through this basic life cycle.

> Tip: A module can be anything! Feel free to wrap every model, component, utility function, etc in its own module.

## To Be Continued...

That's really all you need to get started. Take a look at the [github wiki](https://github.com/bowheart/sheath.js/wiki) for a more in-depth rundown and the full API documentation.
