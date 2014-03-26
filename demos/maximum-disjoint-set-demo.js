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

var r0101 = factory.createAxisParallelRectangle({xmin:0,xmax:1, ymin:0,ymax:1});
var r1212 = factory.createAxisParallelRectangle({xmin:1,xmax:2, ymin:1,ymax:2});
var r2323 = factory.createAxisParallelRectangle({xmin:2,xmax:3, ymin:2,ymax:3});
var disjointSet = jsts.algorithm.maximumDisjointSet([r2323,r1212]);
console.log(disjointSet.length);
disjointSet.forEach(function(cur) {console.log(cur.toString())});  // should contain 3 rectangles.
