function BasicUrlState(){
	
}

BasicUrlState.prototype.objToCompactState = function(obj) {
	// round to 2 decimals
	function roundDecimals(a){ 
		return Math.round(100*a) / 100; 
	};

	return [
		obj.params, 
		obj.paramComps.map(roundDecimals), 
		obj.choices, 
		obj.choiceComps.map(function (a) { return a.map(roundDecimals); } ),
	];
};

BasicUrlState.prototype.compactStateToObj = function(compactState) {
	return {
		params: compactState[0],
		paramComps: compactState[1],
		choices: compactState[2],
		choiceComps: compactState[3]
	};
};

BasicUrlState.prototype.encode = function(obj) {
	var compactState = this.objToCompactState(obj);
	//console.log(compactState)
	var json = JSON.stringify(compactState);
	//console.log(json)
	var stateString = btoa(json);
	//console.log(stateString)
	return stateString;
};

BasicUrlState.prototype.decode = function(stateString) {
	var json = atob(stateString);
	//console.log(json)
	var compactState = JSON.parse(json);
	//console.log(compactState)
	var obj = this.compactStateToObj(compactState);
	//console.log(obj)
	return obj
};




function CompactUrlState(){
	this.delim = ',';
}

CompactUrlState.prototype.encodeArray = function(array) {
	return [array.length].concat(array).join(this.delim);
};

CompactUrlState.prototype.encode = function(obj) {
	var data = [];
	data.push(this.encodeArray(state.params));
	data.push(this.encodeArray(state.paramComps));
	data.push(this.encodeArray(state.choices));
	data.push(this.encodeArray(state.choiceComps));
	return data.join(this.delim);
};

CompactUrlState.prototype.decode = function(stateString) {
	var keys = ['params', 'paramComps', 'choices', 'choiceComps'];
	var state = {};
	var arr = string.split(this.delim);
	var j = 0;
};

