var SYNCHRONOUS = 0;

var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

var walls = new jsts.geom.Envelope(0,1600,0,1600);
var candidates = factory.createRotatedSquaresTouchingPoints([
	{x:5,y:5},
	{x:5,y:25},
	{x:5,y:70},
	{x:5,y:190},
	{x:5,y:395},
	{x:5,y:1600},
	{x:25,y:5},
	{x:70,y:5},
	{x:190,y:5},
	{x:395,y:5},
	{x:1600,y:5},
	{x:1600,y:1600},
	], walls);
console.log(candidates.length+" candidates");
var startTime = new Date();
if (SYNCHRONOUS) {
	var disjointSet = jsts.algorithm.maximumDisjointSet(candidates);
	console.log(disjointSet.length+" disjoints: ");
	console.dir(jsts.stringify(disjointSet));
	console.log(new Date()-startTime+" [ms]");
} else { // ASYNCHRONOUS:
	var MDS = new jsts.algorithm.MaximumDisjointSetSolver(candidates);
	setTimeout(function(){
		console.log("This took too long - Interrupting");
		MDS.interrupt();
	}, 1000); // interrupt after a second
	MDS.solve(function(disjointSet) {
		console.log(disjointSet.length+" disjoints: ");
		console.dir(jsts.stringify(disjointSet));
		console.log(new Date()-startTime+" [ms]");
	});
}


