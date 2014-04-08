var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

var square    = new jsts.geom.Envelope(0,400, 0,400);
var fatrect1  = new jsts.geom.Envelope(0,300, 0,400); // a 2-fat rectangle
var fatrect2  = new jsts.geom.Envelope(0,400, 0,200); // a 2-fat rectangle
var thinrect1 = new jsts.geom.Envelope(0,100, 0,400); // a 2-fat rectangle
var thinrect2 = new jsts.geom.Envelope(0,400, 0,90); // a 2-fat rectangle

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

console.log("One person can get at least 1/2 of the points");
console.log(jsts.stringify(factory.createHalfProportionalDivision([points1],square)));
console.log(jsts.stringify(factory.createHalfProportionalDivision([points2],square)));
console.log(jsts.stringify(factory.createHalfProportionalDivision([points1],fatrect1)));
console.log(jsts.stringify(factory.createHalfProportionalDivision([points2],fatrect1)));
console.log(jsts.stringify(factory.createHalfProportionalDivision([points1],fatrect2)));
console.log(jsts.stringify(factory.createHalfProportionalDivision([points2],fatrect2)));

console.log("Two people can get at least 1/4 of their points");
console.log(jsts.stringify(factory.createHalfProportionalDivision([points1,points2],square)));
console.log(jsts.stringify(factory.createHalfProportionalDivision([points1,points2],fatrect1)));
console.log(jsts.stringify(factory.createHalfProportionalDivision([points1,points2],fatrect2)));
