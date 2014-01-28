var maximumDisjointSet = require('../shared/maximum-disjoint-set');

//var candidates = [
//  	{xmin:1,xmax:2, ymin:1,ymax:2},
//  	{xmin:0,xmax:1, ymin:0,ymax:1},
//  	{xmin:0,xmax:2, ymin:0,ymax:2},
//  	];
//
//console.dir(maximumDisjointSet(candidates));
//
//candidates=
//	[ 
//	  { xmin: 1, xmax: 4, ymin: 1, ymax: 4 },
//	  { xmin: 2, xmax: 5, ymin: 1, ymax: 4 },
//	  { xmin: 3, xmax: 6, ymin: 1, ymax: 4 },
//	  ]
//
//console.dir(maximumDisjointSet(candidates));

candidates=[
            {"xmin":140.4,"xmax":150.4,"ymin":80,"ymax":90},
            {"xmin":150,"xmax":160,"ymin":80,"ymax":90},
            {"xmin":150,"xmax":200,"ymin":40,"ymax":90},
            {"xmin":150,"xmax":200,"ymin":80,"ymax":130},
            {"xmin":150,"xmax":200,"ymin":30.3,"ymax":80.3},
            {"xmin":150,"xmax":200,"ymin":80,"ymax":130},
            ];

console.dir(maximumDisjointSet(candidates));
