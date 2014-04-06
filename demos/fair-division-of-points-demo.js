var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

var envelope1 = new jsts.geom.Envelope(0,300, 0,400); // a 2-fat rectangle
var envelope2 = new jsts.geom.Envelope(0,400, 0,300); // a 2-fat rectangle
var envelope3 = new jsts.geom.Envelope(0,400, 0,400); // a square

var points1 = 
	[{x:0,y:0},
	 {x:300,y:0},
	 {x:0,y:400},
	 {x:300,y:400}];
points1.color='red';

var points2 = 
	[{x:0,y:0},
	 {x:0,y:100},
	 {x:0,y:200},
	 {x:0,y:300},
	 {x:0,y:400},
	 {x:100,y:400},
	 ];
points2.color='blue';

console.log("One person can get at least 1/2 of the points");
console.log(jsts.stringify(factory.createFairAndSquareDivision([points1],envelope1, 1)));
console.log(jsts.stringify(factory.createFairAndSquareDivision([points2],envelope1)));
console.log(jsts.stringify(factory.createFairAndSquareDivision([points1],envelope2, 1)));
console.log(jsts.stringify(factory.createFairAndSquareDivision([points2],envelope2)));
console.log(jsts.stringify(factory.createFairAndSquareDivision([points1],envelope3, 1)));
console.log(jsts.stringify(factory.createFairAndSquareDivision([points2],envelope3)));

console.log("One person with 2-fat rects can get all points");
console.log(jsts.stringify(factory.createFairAndSquareDivision([points1],envelope1, 2)));
console.log(jsts.stringify(factory.createFairAndSquareDivision([points2],envelope1, 2)));
console.log(jsts.stringify(factory.createFairAndSquareDivision([points1],envelope2, 2)));
console.log(jsts.stringify(factory.createFairAndSquareDivision([points2],envelope2, 2)));
console.log(jsts.stringify(factory.createFairAndSquareDivision([points1],envelope3, 2)));
console.log(jsts.stringify(factory.createFairAndSquareDivision([points2],envelope3, 2)));

console.log("Two people can get at least 1/4 of their points");
console.log(jsts.stringify(factory.createFairAndSquareDivision([points1,points2],envelope1)));
console.log(jsts.stringify(factory.createFairAndSquareDivision([points1,points2],envelope2)));

console.log("Two people with 2-fat rects can get at least 1/3 of their points");
console.log(jsts.stringify(factory.createFairAndSquareDivision([points1,points2],envelope1,2)));
console.log(jsts.stringify(factory.createFairAndSquareDivision([points1,points2],envelope2,2)));
