var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

var blueShapes = [
            factory.createAxisParallelRectangle({minx:10,maxx:30, miny:0,maxy:20}),
            factory.createAxisParallelRectangle({minx:10,maxx:30, miny:20,maxy:40})];
var redShapes = [
           factory.createAxisParallelRectangle({minx:0,maxx:40, miny:0,maxy:40}),
           factory.createAxisParallelRectangle({minx:0,maxx:40, miny:40,maxy:80})];
var greenShapes = [
                   factory.createAxisParallelRectangle({minx:0,maxx:20, miny:10,maxy:30}),
                   factory.createAxisParallelRectangle({minx:20,maxx:40, miny:10,maxy:30})];

var representativesBlueRed = jsts.algorithm.representativeDisjointSet([blueShapes, redShapes]);
console.log("Blue shapes: "+jsts.stringify(blueShapes));
console.log("Red  shapes: "+jsts.stringify(redShapes));
console.log("Representatives (blue-red): "+jsts.stringify(representativesBlueRed)); // two representatives found

var representativesBlueGreen = jsts.algorithm.representativeDisjointSet([blueShapes, greenShapes]);
console.log("\nGreen shapes: "+jsts.stringify(greenShapes));
console.log("Representatives (blue-green): "+jsts.stringify(representativesBlueGreen));  // only a single representative could be found
