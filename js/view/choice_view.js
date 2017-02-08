function ChoiceView($container, decision, listView, choiceComparisonView, chartView){
	this.$container = $container;
	this.decision = decision;
	this.listView = listView;
	this.choiceComparisonView = choiceComparisonView;
	this.chartView = chartView;

	this.legendView = new LegendView(chartView.$chart);
}

ChoiceView.prototype.addChoice = function(choice) {
	this.listView.addItem(choice);
	this.choiceComparisonView.addChoice(choice);
	this.updateChart();

	var color = this.chartView.cfg.color(this.decision.choices.length-1);
	this.legendView.addLabel(choice, color);

	this.onScroll();
};

ChoiceView.prototype.setChoices = function(choices) {
	this.listView.setItems(choices);
	this.choiceComparisonView.setChoices(choices);
	this.choiceComparisonView.update();
	this.updateChart();
	this.legendView.setLabels(choices, this.chartView.cfg.color);
	this.onScroll();
};

ChoiceView.prototype.setParameters = function(parameters) {
	this.choiceComparisonView.update();
	this.updateChart();
	this.onScroll();
};

ChoiceView.prototype.setChoiceRatio = function(param, choiceCompId, ratio) {
	this.updateChart();
};

ChoiceView.prototype.setOnChoiceDeleteCallback = function(cb) {
 	this.listView.setOnDeleteCallback(cb);
};

ChoiceView.prototype.setOnChoiceComparisonInputCallback = function(cb) {
	this.choiceComparisonView.setOnChoiceComparisonInputCallback(cb);
};

ChoiceView.prototype.onScroll = function(e) {
	var containerBottom = this.$container.position().top + this.$container.outerHeight(true);
	var chartHeight = this.chartView.$chart.outerHeight(true);
	var chartTop = this.chartView.$chart.position().top;
	var maxAllowedChartTop = containerBottom - chartHeight + 40;
	var desiredCharttop = $(window).scrollTop() + this.chartView.topOffset;
	var newMinChartTop = Math.min(desiredCharttop, maxAllowedChartTop);
	var newChartTop = Math.max(newMinChartTop, this.$container.position().top-30);
	this.chartView.$chart.css('top', newChartTop);
};


ChoiceView.prototype.updateChart = function() {
	var choiceData = this.decision.choices.map(function(){ return []; }, []);
	var params = this.decision.params;
	this.decision.ahps.forEach(function(choiceAhp, i){
		var w = choiceAhp.ratios();
		choiceAhp.params.forEach(function(choice, j){
			//console.log(i, choiceAhp, w, j, choice);
			var d = {
				axis: params[i],
				value: w[j]
			};
			choiceData[j].push(d);
		});
	});

	if(this.decision.choices.length > 0){
		this.chartView.update(choiceData);
	}
};



function ChoiceComparisonView($container, decision, max, scaleFactor, preferenceTexts, onInputCallback){
	this.$container = $container;
	this.decision = decision;
	this.max = max;
	this.scaleFactor = scaleFactor;
	this.preferenceTexts = preferenceTexts;
	this.onInputCallback = onInputCallback;
	this.$comparisonContainer = $('<div></div>');
	this.$container.append(this.$comparisonContainer);
	this.comparisonViews = []; // one for each decision.param

	this.onInputCallback = onInputCallback;
}

ChoiceComparisonView.prototype.inputHandler = function(param) {
	var self = this;
	return function(event, compId, ratio){
		self.onInputCallback(event, param, compId, ratio);
	};
};

ChoiceComparisonView.prototype.setOnChoiceComparisonInputCallback = function(cb) {
	this.onInputCallback = cb;
}

ChoiceComparisonView.prototype.update = function() {
	// Clear
	this.$comparisonContainer.empty();
	this.comparisonViews = [];

	// Add parameters
	var parameters = this.decision.params;
	for (var i = 0; i < parameters.length; i++) {
		var $label = $('<p></p>');
		$label.text(parameters[i] + ':');
		$label.addClass('choice-label');

		var $choiceContainer = $('<div></div>');

		var $miniParamContainer = $('<div></div>');
		$miniParamContainer.append($label);
		$miniParamContainer.append($choiceContainer);

		this.$comparisonContainer.append($miniParamContainer);

		var paramSpecificInputHandler = this.inputHandler(parameters[i]);
		var comparisonView = new ParameterComparisonView($choiceContainer, 
			this.max, this.scaleFactor, this.preferenceTexts, paramSpecificInputHandler);
		this.comparisonViews.push(comparisonView);
	}

	// Add choices
	var choices = this.decision.choices;
	for (var i = 0; i < choices.length; i++) {
		this.addChoice(choices[i]);
	}

	this.updateShow();
};

ChoiceComparisonView.prototype.setParameters = function(parameters, reAddChoices) {
	this.$comparisonContainer.empty();
	this.comparisonViews = [];
	for (var i = 0; i < parameters.length; i++) {
		
		var $label = $('<p>' + parameters[i] + ':</p>');
		var $choiceContainer = $('<div></div>');

		var $miniParamContainer = $('<div></div>');
		$miniParamContainer.append($label);
		$miniParamContainer.append($choiceContainer);

		this.$comparisonContainer.append($miniParamContainer);

		var comparisonView = new ParameterComparisonView($choiceContainer, this.max, this.preferenceTexts, this.onInputCallback);
		this.comparisonViews.push(comparisonView);
	}
	this.updateShow();
};



ChoiceComparisonView.prototype.addChoice = function(choice) {
	for (var i = 0; i < this.comparisonViews.length; i++) {
		var compObjs = this.decision.ahps[i].comparisonObjs();
		this.comparisonViews[i].setComparisons(compObjs);
	}
	this.updateShow();
};

ChoiceComparisonView.prototype.removeChoice = function(choice) {
	for (var i = 0; i < this.comparisonViews.length; i++) {
		var compObjs = this.decision.ahps[i].comparisonObjs();
		this.comparisonViews[i].setComparisons(compObjs);
	}
	this.updateShow();
};

ChoiceComparisonView.prototype.setChoices = function(choices) {
	// Reset comparisons
	this.setParameters(this.decision.params, false); 
	for (var i = 0; i < choices.length; i++) {
		this.addChoice(choices[i]);
	}
	this.updateShow();
};

ChoiceComparisonView.prototype.updateShow = function() {
	if(this.decision.choices.length < 2){
		this.$comparisonContainer.hide();
	}
	else{
		this.$comparisonContainer.show();
	}
};


function LegendView($chart){
	this.$chart = $chart;
	this.$legend = $('<div></div>');
	this.$legend.attr('id', 'choice-chart-legend');
	this.$chart.append(this.$legend);
}

LegendView.prototype.addLabel = function(label, color) {
	var $label = $('<p></p>');

	var $marker = $('<span></span>');
	$marker.css('opacity', 0.7);
	$marker.css('color', color);
	$marker.text('█ ');


	var $text = $('<span></span>');
	$text.text(label);

	$label.append($marker);
	$label.append($text);

	this.$legend.append($label);
};

LegendView.prototype.setLabels = function(labels, colors) {
	this.$legend.empty();
	for (var i = 0; i < labels.length; i++) {
		this.addLabel(labels[i], colors(i));
	}
};
