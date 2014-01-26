var maximumDisjointSet = require('./maximum-disjoint-set');
var rectangles = require('./rectangles');
var powerSet = require('./powerset');


var candidateRects = [
	{xmin:1,xmax:2, ymin:1,ymax:2},
	{xmin:0,xmax:1, ymin:0,ymax:1},
	{xmin:0,xmax:2, ymin:0,ymax:2},
	];

console.dir(maximumDisjointSet(candidateRects));
