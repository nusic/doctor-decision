// Array stuff

Array.prototype.copy = function() {
	var c = [];
	for (var i = 0; i < this.length; i++) {
		c.push(this[i]);
	}
	return c;
};

Array.prototype.sameAs = function(other){
	if (this === other) return true;
	if (other == null) return false;
	if (this.length != other.length) return false;

	for (var i = 0; i < this.length; ++i) {
		if (this[i] !== other[i]) return false;
	}
	return true;
}

Array.prototype.toObject = function(value){
	return this.reduce(function(object, element){
		object[element] = value;
		return object;
	}, {});
}


// Object stuff

Object.prototype.toArray = function() {
	var self = this;
	return Object.keys(this).map(function(key){
		return [key, self[key]];
	});
};


// String stuff

String.prototype.replaceAll = function(search, replacement) {
    return this.split(search).join(replacement);
};


// Counter

function Counter(){
	this.map = {};
}

Counter.prototype.increment = function(item) {
	if(this.map[item] === undefined){
		this.map[item] = 1;
	}
	else {
		this.map[item]++;
	}
};


/**
* Provides a mechanism to attach callback functions to 
* methods invocations of the target instance.
*
* @param instance the object to provide method callbacks on
* @param hookFn the function to be called when any instance 
* 		 method is invoked. The callback takes 3 arguments:
*			1. the name of the method being called
*			2. the argument list
*/
function Hooked(instance, options, instanceName){
	this.methodCallHook = options.methodCallHook;
	this.methodReturnHook = options.methodReturnHook;
	this.propertyGetterHook = options.propertyGetterHook;
	this.propertySetterHook = options.propertySetterHook;
	this.recursive = options.recursive || false;
	this.instanceName = instanceName;
	this.setInstance(instance);
}

Hooked.prototype.setInstance = function(that, propertySrc) {
	propertySrc = propertySrc || that;

	var self = this;
	Object.keys(propertySrc).forEach(function(property){
		if(self[property] !== undefined) {
			// Properties with same in the name deeper in the prototype chain
			// should not override so the properties with higher proximity, so 
			// don't add it to the object
			return;
		}

		//console.log(typeof propertySrc[property], property, propertySrc[property]);

		if(typeof propertySrc[property] === 'function'){
			self[property] = function(){
				if(self.methodCallHook) {
					self.methodCallHook(property, arguments);
				}
				var retVal = propertySrc[property].apply(that, arguments);
				if(self.methodReturnHook) {
					self.methodReturnHook(property, arguments, retVal);
				}
				return retVal
			};
		}
		else {
			if(self.recursive && propertySrc[property] && typeof propertySrc[property] === 'object'){
				//console.log('recursively adding logger: ', property, propertySrc[property]);
				var options = {
					methodCallHook: self.methodCallHook,
					methodReturnHook: self.methodReturnHook,
					propertyGetterHook: self.propertyGetterHook,
					propertySetterHook: self.propertySetterHook,
					recursive: self.recursive, // true
				}
				propertySrc[property] = new Hooked(propertySrc[property], options, self.instanceName+'.'+property);
			}

			Object.defineProperty(self, property, {
				get: function(){ 
					if(self.propertyGetterHook) {
						self.propertyGetterHook(property, propertySrc[property]);
					}
					return propertySrc[property];
				},
				set: function (x) { 
					if(self.propertySetterHook) {
						self.propertySetterHook(property, x);
					}
					if(self.recursive && typeof x === 'object'){
						return propertySrc[property] = new Hooked(x, self.options);
					}
					else return propertySrc[property] = x;
				}
			});
		}
	});

	if(propertySrc.__proto__){
		this.setInstance(that, propertySrc.__proto__);
	}

	return this;
};


function logging(instance, instanceName){

	if(!instanceName){
		var constructor = instance.__proto__.constructor.name;
		instanceName = constructor[0].toLowerCase() + constructor.substr(1);
		console.log('OBS! using default instanceName: ' + instanceName);
	}


	var indent = "";

	function logCall(methodName, args){
		console.log(indent + instanceName + '.' + methodName + '(', args, ')');
		indent += '  ';
	}

	function logReturn(methodName, args, retVal){
		//console.log(indent, instanceName + '.' + methodName + '(', args, ')');
		indent = indent.substr(0, indent.length -2);
		console.log(indent + '>> ', retVal);
	};

	function logGetter(propertyName, value){
		console.log(indent + instanceName + '.' + propertyName + '  //', value);
	}

	function logSetter(propertyName, x){
		console.log(indent + instanceName + '.' + propertyName + ' =',x);
	}

	var options = {
		methodCallHook: logCall,
		methodReturnHook: logReturn,
		propertyGetterHook: logGetter,
		propertySetterHook: logSetter,
		recursive: true,
	};


	return new Hooked(instance, options, instanceName);
}