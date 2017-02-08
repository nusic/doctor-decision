function ParameterView($container, ahp, listView, comparisonView, chartView){
	this.$container = $container;
	this.ahp = ahp;
	this.listView = listView; 
	this.comparisonView = comparisonView;
	this.chartView = chartView;
}

ParameterView.prototype.setParameters = function(parameters) {
	this.listView.setItems(parameters);
	this.comparisonView.setComparisons(this.ahp.comparisonObjs());
	this.updateChart();
	this.onScroll();
};

ParameterView.prototype.addParameter = function(parameter) {
	this.listView.addItem(parameter);
	this.comparisonView.setComparisons(this.ahp.comparisonObjs());
	this.updateChart();
	this.onScroll();
};

ParameterView.prototype.updateChart = function() {
	var params = this.ahp.params;
	var preferenceRatios = this.ahp.ratios();
	var preferenceData = params.map(function(param, i){
		return {
			axis: param,
			value: preferenceRatios[i],
		};
	});

	this.chartView.update([preferenceData]);	
};

/**
* @param cb A callback the input event as argument
*/
ParameterView.prototype.setOnComparisonInputCallback = function(cb) {
	this.comparisonView.onInputCallback = cb;
};

ParameterView.prototype.setOnParameterDeleteCallback = function(cb) {
	this.listView.setOnDeleteCallback(cb);
};



///////////////
// List View //
///////////////

function ListView($container, itemIdPrefix, onDeleteCallback) {
	this.$container = $container;
	this.itemIdPrefix = itemIdPrefix || "";
	this.onDeleteCallback = onDeleteCallback;
}

ListView.prototype.onDeleteHandler = function(e) {
	// the id of the element to be deleted
	this.onDeleteCallback(e, e.target.id);
};

ListView.prototype.setOnDeleteCallback = function(cb) {
	this.onDeleteCallback = cb;
};

ListView.prototype.setItems = function(parameters) {
	this.$container.empty();
	for (var i = 0; i < parameters.length; i++) {
		this.addItem(parameters[i]);
	}
};

ListView.prototype.addItem = function(parameter) {
	var $item = $('<p></p>');
	$item.attr('id', this.itemIdPrefix + parameter);
	$item.text(parameter + '\xa0\xa0\xa0');
	this.$container.append($item);

	$delete = $('<a>&#9747;</a>');
	$delete.addClass('list-delete');
	$delete.attr('id', parameter);
	$delete.on('click', this.onDeleteHandler.bind(this));
	$item.append($delete);
};



///////////////////////////////
// Parameter Comparison View //
///////////////////////////////

function ParameterComparisonView($container, max, scaleFactor, preferenceTexts, onInputCallback){
	this.$container = $container;
	this.max = max;
	this.scaleFactor = scaleFactor || 1;
	this.preferenceTexts = preferenceTexts;
	this.onInputCallback = onInputCallback;
}

ParameterComparisonView.prototype.rangeValueToRatio = function(value) {
	// positive values = preference for right parameter
	// negative values = preference for left parameter
	// ratio is defined as: left parameter / right parameter 
	// therefore: large value --> small ratio
	value /= this.scaleFactor;
	var ratio = (value > 0) ? 1 / (value+1) : 1 - value;
	return ratio;
};

ParameterComparisonView.prototype.ratioToRangeValue = function(ratio) {
	var rangeValue = (ratio >= 1) ? 1 - ratio : Math.round(1 / ratio) - 1;
	return rangeValue * this.scaleFactor;
};


ParameterComparisonView.prototype.inputHandler = function(event) {
	var id = event.target.id;
	var labelId = event.target.id + '-label';
	var label = document.getElementById(labelId);
	$label = $(label);
	$label.text(this.valueToLabel(id, event.target.value));
	if(this.onInputCallback){
		var value = +event.target.value;
		var ratio = this.rangeValueToRatio(value);
		this.onInputCallback(event, id, ratio);
	}
};

ParameterComparisonView.prototype.valueToLabel = function(compId, value) {
	if(+value === 0) {
		return 'Both ' + this.preferenceTexts[0];
	}
	var textIndex = Math.ceil(Math.abs(value) / this.max * (this.preferenceTexts.length-1));
	var text = this.preferenceTexts[textIndex];

	var labelId = compId + (value > 0 ? '-right' : '-left')
	var label = document.getElementById(labelId);
	var preferenceText = $(label).text() + ' is ' + text;
	return preferenceText;
};

/**
* @param comparisons array of objects with keys param1, param2, compId, ratio
* 		 [{param1: '', param2: '', compId: '', ratio}, .. ]
*/
ParameterComparisonView.prototype.setComparisons = function(comparisons) {
	this.$container.empty();
	for (var i = 0; i < comparisons.length; i++) {
		var c = comparisons[i];
		var rangeValue = Math.round(this.ratioToRangeValue(c.ratio));
		this.addComparison(c.param1, c.param2, c.id, rangeValue);
	}
};

ParameterComparisonView.prototype.addComparison = function(param1, param2, compId, rangeValue) {
	var $comp = $('<div></div>');
	$comp.addClass('comparison');

	var $range = $('<input min="-'+this.max+'" max="'+this.max+'">');
	$range.attr('type', 'range');
	$range.attr('id', compId);

	var $paramSpan1 = $('<span></span>');
	$paramSpan1.attr('id', compId + '-left');
	$paramSpan1.text(param1);
	$paramSpan1.addClass('comp-param');
	$paramSpan1.addClass('comp-left');

	var $paramSpan2 = $('<span></span>');
	$paramSpan2.attr('id', compId + '-right');
	$paramSpan2.text(param2);
	$paramSpan2.addClass('comp-param');
	$paramSpan2.addClass('comp-right');

	var $comparisonLabel = $('<div></div>');
	$comparisonLabel.attr('id', compId + '-label');
	$comparisonLabel.addClass('comp-label');
	$comparisonLabel.text(this.preferenceTexts[0]);

	$range.on('input change', this.inputHandler.bind(this));
	//$range.on('mousedown', function(e){ $comparisonLabel.show(); });
	//$range.on('mouseup', function(e){ $comparisonLabel.hide(); });

	$comp.append($paramSpan1);
	$comp.append($range);
	$comp.append($paramSpan2);
	$comp.append($comparisonLabel);

	this.$container.append($comp);


	if(rangeValue !== undefined){
		$range.val(rangeValue);
		var label = this.valueToLabel(compId, rangeValue);
		$comparisonLabel.text(label);
	}
};

ParameterView.prototype.onScroll = function(e) {
	var containerBottom = this.$container.position().top + this.$container.outerHeight(true);
	var chartHeight = this.chartView.$chart.outerHeight(true);
	var chartTop = this.chartView.$chart.position().top;
	var maxAllowedChartTop = containerBottom - chartHeight + 40;
	var desiredCharttop = $(window).scrollTop() + this.chartView.topOffset;
	var newMinChartTop = Math.min(desiredCharttop, maxAllowedChartTop);
	var newChartTop = Math.max(newMinChartTop, this.$container.position().top-30);
	this.chartView.$chart.css('top', newChartTop);
};
