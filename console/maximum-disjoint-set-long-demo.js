var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

var walls = new jsts.geom.Envelope(0,400,0,400);
var candidates = factory.createRotatedSquaresTouchingPoints([
	{x:5,y:5},
	{x:5,y:25},
	{x:5,y:70},
	{x:5,y:190},
	{x:5,y:395},
	{x:25,y:5},
	{x:70,y:5},
	{x:190,y:5},
	{x:395,y:5},
	{x:395,y:395},
	], walls);
console.log(candidates.length+" candidates");
var startTime = new Date();
var disjointSet = jsts.algorithm.maximumDisjointSet(candidates);
console.log(disjointSet.length+" disjoints");
disjointSet.forEach(function(cur) {console.log(cur.toString())});  // should contain 3 rectangles.
console.log(new Date()-startTime+" [ms]");
