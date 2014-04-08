var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

//candidates=[
//            factory.createAxisParallelRectangle(-70,110,  140,320),
//            factory.createAxisParallelRectangle(90,210, 200,320),
//            factory.createAxisParallelRectangle(100,110, 200,210),
//            factory.createAxisParallelRectangle(140,130, 220,210),
//            factory.createAxisParallelRectangle(200,130, 280,210),
//            factory.createAxisParallelRectangle(200,130, 280,210),
//            ]
//var disjointSet = jsts.algorithm.maximumDisjointSet(candidates);
//disjointSet.forEach(function(cur) {console.log(cur.toString())});  // should contain 3 rectangles.
//console.log();

var r0101 = factory.createAxisParallelRectangle({minx:0,maxx:1, miny:0,maxy:1});
var r1212 = factory.createAxisParallelRectangle({minx:1,maxx:2, miny:1,maxy:2});
var r2323 = factory.createAxisParallelRectangle({minx:2,maxx:3, miny:2,maxy:3});
var disjointSet = jsts.algorithm.maximumDisjointSet([r2323,r1212]);
console.log(disjointSet.length);
disjointSet.forEach(function(cur) {console.log(cur.toString())});  // should contain 3 rectangles.
