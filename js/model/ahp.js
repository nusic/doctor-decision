/**
* Class representing a Analityc Hierarchy Process.
* (https://en.wikipedia.org/wiki/Analytic_hierarchy_process)
*
*/
function AHP(){
	this.params = [];
	this.comparisons = {};
}

/// Symbol to separate parameters in the mapping
/// of pairs of parameters to a comparison value
AHP.prototype.SEPARATOR_SYMBOL = '\\';

/// Symbol suggested for replacement if SEPARATOR_SYMVOL
/// is found in a parameter name
AHP.prototype.SEPARATOR_REPLACEMENT_SYMBOL = '/';

AHP.prototype.setParameters = function(params){
	this.params = [];
	for (var i = 0; i < params.length; i++) {
		this.params[i] = params[i];
	}
	this.updateComparisonIds();
}

AHP.prototype.addParameter = function(param) {
	if(!param) throw 'Illegal param: ' + param;
	this.params = this.params.concat(param);
	this.updateComparisonIds();	
};

AHP.prototype.removeParameter = function(param){
	var paramIndex = Number.isInteger(param) ? param : this.params.indexOf(param);
	this.params.splice(paramIndex, 1);
	this.updateComparisonIds();
}

AHP.prototype.updateComparisonIds = function() {
	var oldComparisons = this.comparisons;
	this.comparisons = {};
	for (var i = 0; i < this.params.length; i++) {
		for (var j = i+1; j < this.params.length; j++) {
			var compId = this.params[i] + AHP.prototype.SEPARATOR_SYMBOL + this.params[j];
			this.comparisons[compId] = 1.0;

			// If we had a previous value for this, keep it
			if(oldComparisons[compId] !== undefined){
				this.comparisons[compId] = oldComparisons[compId]
			}
		}
	}
};

AHP.prototype.paramsToCompId = function(param1, param2) {
	return param1 + AHP.prototype.SEPARATOR_SYMBOL + param2;
};

AHP.prototype.compIdToParams = function(compId) {
	return compId.split(AHP.prototype.SEPARATOR_SYMBOL);
};

AHP.prototype.setPreference = function(compId, ratio) {
	if(this.comparisons[compId] === undefined){
		throw "Illegal compId: " + compId;
	}
	if(this.comparisons[compId] !== ratio){
		this.comparisons[compId] = ratio;
	}
};

AHP.prototype.comparisonIds = function() {
	return Object.keys(this.comparisons);
};

AHP.prototype.comparisonObjs = function() {
	var self = this;
	return Object.keys(this.comparisons).map(function(compId){
		var params = self.compIdToParams(compId);
		if(params.length !== 2){
			throw "Illegal comparison id: " + c;
		}
		return {
			param1: params[0],
			param2: params[1],
			id: compId,
			ratio: self.comparisons[compId],
		};
	});
};

AHP.prototype.compData = function() {
	var self = this;
	return Object.keys(this.comparisons).map(function(compId){
		var ratio = self.comparisons[compId];
		return ratio;
	});
};

/**
* @param params 		an array of n parameters
* @param compData 		an array of n(n-1)/2 comparisons. Each comparison is 
*						an array of 3 values [paramId1, paramId2, ratio]
*/
AHP.prototype.setParamsAndCompData = function(params, compData){
	var expectedComps = params.length * (params.length - 1) / 2;
	if(compData.length !== expectedComps){
		throw 'Illegal number of comparisons';
	}

	this.comparisons = {};
	this.setParameters(params);

	var self = this;
	this.comparisonIds().forEach(function(compId, i){
		self.comparisons[compId] = +compData[i];
	});
};

AHP.prototype.ratios = function() {
	if(this.params.length === 0) {
		return [];
	}

	var compIds = this.comparisonIds();
	if(compIds.length === 0){
		return [1];
	}

	var paramMap = this.params.toObject(0);
	var sum = 0;
	for (var i = 0; i < compIds.length; i++) {
		var compId = compIds[i];
		var compRatio = this.comparisons[compId];

		var delimPos = compId.indexOf(AHP.prototype.SEPARATOR_SYMBOL);
		var numeratorId = compId.substr(0, delimPos);
		var divisorId = compId.substr(delimPos+1);
		
		paramMap[numeratorId] += compRatio;
		paramMap[divisorId] += (1 / compRatio);
		sum += compRatio + (1 / compRatio);
	}

	var ratios = [];
	for (var i = 0; i < this.params.length; i++) {
		ratios.push(paramMap[this.params[i]] / sum);
	}

	return ratios;
};


AHP.prototype.eval = function(decision) {
	if(!this.params.sameAs(decision.params)){
		console.error(this.params);
		console.log(decision)
		console.error(decision.params());

		throw "evaluated AHPs must have same params!";
	}

	//console.log('no sure if 0 or 1 here');
	var evaluation = decision.choices.toObject(0);
	var ratios = this.ratios();
	
	for (var i = 0; i < this.params.length; i++) {
		var choiceRatios = decision.ahps[i].ratios();
		for (var j = 0; j < choiceRatios.length; j++) {
			evaluation[decision.choices[j]] += ratios[i] * choiceRatios[j];
		}
	}
	return evaluation;
};




/**
* 
*/
function Decision(choices, params){
	this.choices = choices || [];
	this.params = params || [];
	this.ahps = [];

	if(params){
		this.setParameters(params);
	}
}

Decision.prototype.choiceComparisonData = function() {
	var self = this;
	return this.params.map(function(param, i){
		return self.ahp(param).comparisonData();
	});
};

Decision.prototype.choiceCompData = function() {
	var self = this;
	return this.params.map(function(param, i){
		return self.ahp(param).compData();
	});
};

Decision.prototype.setParameters = function(parameters) {
	this.params = parameters;
	if(!this.choices) {
		return;
	}

	this.ahps = [];
	for (var i = 0; i < this.params.length; i++) {
		var paramAhp = new AHP();
		paramAhp.setParameters(this.choices);
		this.ahps.push(paramAhp);
	}
};

Decision.prototype.addParameter = function(param) {
	this.params.push(param);
	var paramAhp = new AHP();
	paramAhp.setParameters(this.choices);
	this.ahps.push(paramAhp);
};

Decision.prototype.removeParameter = function(param) {
	var paramIndex = Number.isInteger(param) ? param : this.params.indexOf(param);
	this.params.splice(paramIndex, 1);
	this.ahps.splice(paramIndex, 1);
};

Decision.prototype.setChoices = function(choices) {
	this.choices = choices;
	this.ahps.forEach(function(ahp){
		ahp.setParameters(choices);
	});
};

Decision.prototype.addChoice = function(choice) {
	this.choices.push(choice);
	this.ahps.forEach(function(ahp){
		ahp.addParameter(choice);
	});
};

Decision.prototype.removeChoice = function(choice) {
	var choiceIndex = Number.isInteger(choice) ? choice : this.choices.indexOf(choice);
	this.choices.splice(choiceIndex, 1);
	this.ahps.forEach(function(ahp){
		ahp.removeParameter(choice);
	});
};

Decision.prototype.ahp = function(param) {
	var paramIndex = this.params.indexOf(param);
	if(paramIndex === -1){
		throw 'Illegal param ' + param;
	}
	return this.ahps[paramIndex];
};

Decision.prototype.setParamsChoicesAndChoiceComparisons = function(params, choices, choiceComps) {
	this.setParameters(params);
	this.choices = choices;
	// Set ahps
	for (var i = 0; i < choiceComps.length; i++) {
		this.ahps[i].setParamsAndComparisons(choices, choiceComps[i]);
	}
	//this.setChoices(choices);
};

Decision.prototype.setParamsChoicesAndChoiceCompData = function(params, choices, choiceCompData) {
	this.setParameters(params);
	// Set ahps
	for (var i = 0; i < choiceCompData.length; i++) {
		this.ahps[i].setParamsAndCompData(choices, choiceCompData[i]);
	}
	this.setChoices(choices);
};



/**
* Modelling the decision making process through AHP.
* 
* This class also serves as a proxy object
*/
function AhpDecision(obj){
	this.ahp = new AHP();
	this.decision = new Decision();

	if(obj){
		this.setFromObj(obj);
	}
}

// Accessors
// ---------

AhpDecision.prototype.parameterSeparatorSymbol = function() {
	return AHP.prototype.SEPARATOR_SYMBOL;
};

AhpDecision.prototype.parameterSeparatorReplacementSymbol = function() {
	return AHP.prototype.SEPARATOR_REPLACEMENT_SYMBOL;
};

AhpDecision.prototype.params = function() {
	return this.ahp.params;
};

AhpDecision.prototype.paramComparisonIds = function() {
	return this.ahp.comparisonIds();
};

AhpDecision.prototype.paramComparisonObjs = function() {
	return this.ahp.comparisonObjs();
};

AhpDecision.prototype.preferenceRatios = function() {
	return this.ahp.ratios();
};

AhpDecision.prototype.choices = function() {
	return this.decision.choices;
};

AhpDecision.prototype.choiceAhps = function() {
	return this.decision.ahps;
};

AhpDecision.prototype.paramId = function(param) {
	return this.ahp.params.indexOf(param);
};

AhpDecision.prototype.choiceId = function(choice) {
	return this.decision.choices.indexOf(choice);
};

AhpDecision.prototype.hasParam = function(param) {
	return this.paramId(param) !== -1;
};

AhpDecision.prototype.hasChoice = function(choice) {
	return this.choiceId(choice) !== -1;
};

AhpDecision.prototype.evaluation = function() {
	return this.ahp.eval(this.decision);
};

AhpDecision.prototype.toObj = function() {
	return {
		params: this.params(),
		paramComps: this.ahp.compData(),
		choices: this.choices(),
		choiceComps: this.decision.choiceCompData(),
	}
};



// Mutators - returns true on success, false otherwise
// --------

AhpDecision.prototype.addParameter = function(param) {
	if(!this.hasParam(param)){
		this.ahp.addParameter(param);
		this.decision.addParameter(param);
		return true;
	}
	return false;
};

AhpDecision.prototype.removeParameter = function(param) {
	if(this.hasParam(param)){
		this.ahp.removeParameter(param);
		this.decision.removeParameter(param);
		return true;
	}
	return false;
};

AhpDecision.prototype.setParameters = function(params) {
	this.ahp.setParameters(params);
	this.decision.setParameters(params.copy());
	return true;
}

AhpDecision.prototype.setPreference = function(compId, ratio) {
	this.ahp.setPreference(compId, ratio);
	return true;
};

AhpDecision.prototype.addChoice = function(choice) {
	if(!this.hasChoice(choice)){
		this.decision.addChoice(choice);
		return true;
	}
	return false;
};

AhpDecision.prototype.removeChoice = function(choice) {
	if(this.hasChoice(choice)){
		this.decision.removeChoice(choice);
		return true;
	}
	return false;
};

AhpDecision.prototype.setChoiceRatio = function(param, choiceCompId, ratio) {
	this.decision.ahp(param).setPreference(choiceCompId, ratio);
	return true;
};

AhpDecision.prototype.setFromObj = function(obj) {
	this.ahp.setParamsAndCompData(obj.params || [], obj.paramComps || []);
	this.decision.setParamsChoicesAndChoiceCompData(obj.params || [], obj.choices, obj.choiceComps || []);
	return true;
};
