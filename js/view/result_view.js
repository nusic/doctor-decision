function ResultView($container, ahpDecision){
	this.$container = $container;
	this.ahpDecision = ahpDecision;
	
	this.$ol = $('<div></div>');
	this.$container.append(this.$ol);
}

ResultView.prototype.update = function() {
	var evaluation = this.ahpDecision.evaluation();
	var evalArr = evaluation.toArray();
	var ranking = evalArr.sort(function(a,b){
		return a[1] < b[1];
	});


	this.$ol.empty();
	for (var i = 0; i < ranking.length; i++) {
		var $li = $('<p></p>');
		var percent = Math.round((+ranking[i][1]) * 100);
		$li.text((i+1) +'.  ' + ranking[i][0] + '  (' + percent + '%)');
		this.$ol.append($li);
	}

};