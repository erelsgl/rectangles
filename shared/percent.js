Math.percent = function(probability) {
	var percent = Math.round(probability*100);
	return percent+"%";
	// return (percent>99? 99: percent);
}
