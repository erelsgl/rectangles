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
            {"xmin":-70,"ymin":110,"xmax":140,"ymax":320,"color":"#000"},
            {"xmin":90,"ymin":210,"xmax":200,"ymax":320,"color":"#f00"},
            {"xmin":100,"ymin":110,"xmax":200,"ymax":210,"color":"#ff0"},
            {"xmin":140,"ymin":130,"xmax":220,"ymax":210,"color":"#880"},
            {"xmin":200,"ymin":130,"xmax":280,"ymax":210,"color":"#880"},
            ]

console.dir(maximumDisjointSet(candidates));

