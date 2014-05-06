var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

var quarterplane_NE    = new jsts.geom.Envelope(0,Infinity, 0,Infinity);
var quarterplane_SW    = new jsts.geom.Envelope(-Infinity,0, -Infinity,0);
var quarterplane_SW2   = new jsts.geom.Envelope(-Infinity,400, -Infinity,400);

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
//console.log(jsts.stringify(factory.createHalfProportionalDivision([points1],quarterplane_NE)));

//console.log("Two people can get at least 1/3 of the points");
//console.log(jsts.stringify(factory.createHalfProportionalDivision([points1, points1],quarterplane_NE)));
//console.log(jsts.stringify(factory.createHalfProportionalDivision([points1, points2],quarterplane_NE)));
//
//console.log("One person on a rotated quarterplane_NE");
//var points1Rotated = 
//	[{x:0,y:0},
//	 {x:-300,y:0},
//	 {x:0,y:-400},
//	 {x:-300,y:-400},
//	 {x:-100,y:-100},
//	 ];
//points1.color='red';
//console.log(jsts.stringify(factory.createHalfProportionalDivision([points1Rotated],quarterplane_SW)));

points1Rotated = 
	[{x:0,y:0},
	 {x:300,y:0},
	 {x:0,y:400},
	 {x:300,y:400},
	 {x:100,y:100},
	 ];
points1.color='red';
console.log(jsts.stringify(factory.createHalfProportionalDivision([points1Rotated],quarterplane_SW2)));


//console.log("Two people on a rotated quarterplane_NE");
//console.log(jsts.stringify(factory.createHalfProportionalDivision([points1Rotated, points1Rotated],quarterplane_SW)));
//
//
