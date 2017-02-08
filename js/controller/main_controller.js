function MainController(ahpDecision, parameterView, choiceView, resultsView, urlStateEncoder){
	this.ahpDecision = ahpDecision;
	this.parameterView = parameterView;
	this.choiceView = choiceView;
	this.resultsView = resultsView;
	this.urlStateEncoder = urlStateEncoder;
	
	var self = this;
	this.parameterView.setOnComparisonInputCallback(function(e, compId, ratio){
		if(compId === undefined) throw 'undefined compId';
		if(ratio === undefined) throw 'undefined ratio'

		self.setPreference(compId, ratio);
	});

	this.parameterView.setOnParameterDeleteCallback(function(e, parameter){
		if(parameter === undefined) throw 'undefined parameter';

		self.removeParameter(parameter);
	});


	this.choiceView.setOnChoiceDeleteCallback(function(e, choice){
		if(choice === undefined) throw 'undefined choice';

		self.removeChoice(choice);
	});

	this.choiceView.setOnChoiceComparisonInputCallback(function(e, parameter, compId, ratio){
		if(parameter === undefined) throw 'undefined parameter';
		if(compId === undefined) throw 'undefined compId';
		if(ratio === undefined) throw 'undefined ratio'

		self.setChoiceRatio(parameter, compId, ratio);
	});

}

MainController.prototype.setParameters = function(parameters) {
	if(this.ahpDecision.setParameters(parameters)){
		this.parameterView.setParameters(parameters);
		this.choiceView.setParameters(parameters);
		this.resultsView.update();
	}
};

MainController.prototype.addParameter = function(param) {
	// Make sure parameter name is legal
	var illegalSymbol = this.ahpDecision.parameterSeparatorSymbol();
	var replacement = this.ahpDecision.parameterSeparatorReplacementSymbol();
	param = param.replaceAll(illegalSymbol, replacement);

	// add parameter
	if(this.ahpDecision.addParameter(param)){
		this.parameterView.addParameter(param);	
		this.choiceView.setParameters(this.ahpDecision.params());
		this.resultsView.update();
	}
};

MainController.prototype.removeParameter = function(param) {
	if(this.ahpDecision.removeParameter(param)){
		this.parameterView.setParameters(this.ahpDecision.params());
		this.choiceView.setParameters(this.ahpDecision.params());
		this.resultsView.update();
	}
};

MainController.prototype.setPreference = function(compId, ratio) {
	if(this.ahpDecision.setPreference(compId, ratio)){
		this.parameterView.updateChart();
		this.choiceView.updateChart();
		this.resultsView.update();
	}
};

MainController.prototype.setChoices = function(choices) {
	if(this.ahpDecision.setChoices(choices)){
		this.choiceView.setChoices(choices);
		this.resultsView.update();
	}
};

MainController.prototype.addChoice = function(choice) {
	if(this.ahpDecision.addChoice(choice)){
		this.choiceView.addChoice(choice);
		this.resultsView.update();
	}
};

MainController.prototype.removeChoice = function(choice) {
	if(this.ahpDecision.removeChoice(choice)){
		var choices = this.ahpDecision.choices();
		this.choiceView.setChoices(choices);
		this.resultsView.update();
	}
};

MainController.prototype.setChoiceRatio = function(param, choiceCompId, ratio) {
	if(this.ahpDecision.setChoiceRatio(param, choiceCompId, ratio)){
		this.choiceView.setChoiceRatio(param, choiceCompId, ratio);
		this.resultsView.update();
	}
};

MainController.prototype.onScroll = function(e) {
	this.parameterView.onScroll(e);
	this.choiceView.onScroll(e);
};

MainController.prototype.stateString = function() {
	var obj = this.ahpDecision.toObj();
	return this.urlStateEncoder.encode(obj);
};

MainController.prototype.updateWindowHash = function() {
	window.location.hash = '#' + this.stateString();
};

MainController.prototype.setFromCompactState = function(stateString) {
	var obj = this.urlStateEncoder.decode(stateString);
	this.ahpDecision.setFromObj(obj);
	this.updateViews()
};

MainController.prototype.setFromObj = function(obj) {
	this.ahpDecision.setFromObj(obj);
	this.updateViews();
};

MainController.prototype.updateViews = function() {
	var params = this.ahpDecision.params();
	var choices = this.ahpDecision.choices();
	this.parameterView.setParameters(params);
	this.choiceView.setChoices(choices);
	this.resultsView.update();
};
