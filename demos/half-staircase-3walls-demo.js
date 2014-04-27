var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

var sukka    = new jsts.geom.Envelope(0,400, 0,Infinity);

var points1 = 
	[{x:0,y:0},
	 {x:300,y:0},
	 {x:0,y:400},
	 {x:300,y:400},
	 {x:100,y:100},
	 ];
points1.color='red';

var points2 = 
	[
	 {x:0,y:0},
	 {x:0,y:100},
	 {x:0,y:200},
	 {x:0,y:400},
	 {x:100,y:400},
	 {x:10,y:10},
	 {x:10,y:100},
	 {x:10,y:210},
	 {x:10,y:400},
	 ];
points2.color='blue';

//console.log("One person can get all points");
//console.log(jsts.stringify(factory.createHalfProportionalDivision([points1],sukka)));

console.log("Two people can get at least 1/3 of the points");
console.log(jsts.stringify(factory.createHalfProportionalDivision([points1, points1],sukka)));
//console.log(jsts.stringify(factory.createHalfProportionalDivision([points1, points2],sukka)));


