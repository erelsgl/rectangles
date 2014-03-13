/**
 * time tests for JSTS routings
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

var r1212 = factory.createAxisParallelRectangle({xmin:1,xmax:2, ymin:1,ymax:2});
var r2323 = factory.createAxisParallelRectangle({xmin:2,xmax:3, ymin:2,ymax:3});
var r3434 = factory.createAxisParallelRectangle({xmin:3,xmax:4, ymin:3,ymax:4});
var rects = [r1212, r2323, r3434];

var before = new Date();
for (var i=0; i<100; ++i)
	jsts.algorithm.arePairwiseNotOverlapping(rects);
console.log(new Date()-before);

