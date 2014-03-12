var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

candidates=[
            factory.createAxisParallelRectangle(-70,110,  140,320),
            factory.createAxisParallelRectangle(90,210, 200,320),
            factory.createAxisParallelRectangle(100,110, 200,210),
            factory.createAxisParallelRectangle(140,130, 220,210),
            factory.createAxisParallelRectangle(200,130, 280,210),
            factory.createAxisParallelRectangle(200,130, 280,210),
            ]
var disjointSet = jsts.algorithm.maximumDisjointSet(candidates);
disjointSet.forEach(function(cur) {console.log(cur.toString())});  // should contain 3 rectangles.
