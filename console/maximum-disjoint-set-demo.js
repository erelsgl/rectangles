var maximumDisjointSet = require('../shared/maximum-disjoint-set');

var candidates = [
  	{xmin:1,xmax:2, ymin:1,ymax:2},
  	{xmin:0,xmax:1, ymin:0,ymax:1},
  	{xmin:0,xmax:2, ymin:0,ymax:2},
  	];

console.dir(maximumDisjointSet(candidates));

candidates=
	[ 
	  { xmin: 1, xmax: 4, ymin: 1, ymax: 4 },
	  { xmin: 2, xmax: 5, ymin: 1, ymax: 4 },
	  { xmin: 3, xmax: 6, ymin: 1, ymax: 4 },
	  ]

console.dir(maximumDisjointSet(candidates));

