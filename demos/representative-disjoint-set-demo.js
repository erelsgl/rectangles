var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

var blueShapes = [
            factory.createAxisParallelRectangle({xmin:10,xmax:30, ymin:0,ymax:20}),
            factory.createAxisParallelRectangle({xmin:10,xmax:30, ymin:20,ymax:40})];
var redShapes = [
           factory.createAxisParallelRectangle({xmin:0,xmax:40, ymin:0,ymax:40}),
           factory.createAxisParallelRectangle({xmin:0,xmax:40, ymin:40,ymax:80})];
var greenShapes = [
                   factory.createAxisParallelRectangle({xmin:0,xmax:20, ymin:10,ymax:30}),
                   factory.createAxisParallelRectangle({xmin:20,xmax:40, ymin:10,ymax:30})];

var representativesBlueRed = jsts.algorithm.representativeDisjointSet([blueShapes, redShapes]);
console.log("Blue shapes: "+jsts.stringify(blueShapes));
console.log("Red  shapes: "+jsts.stringify(redShapes));
console.log("Representatives (blue-red): "+jsts.stringify(representativesBlueRed)); // two representatives found

var representativesBlueGreen = jsts.algorithm.representativeDisjointSet([blueShapes, greenShapes]);
console.log("\nGreen shapes: "+jsts.stringify(greenShapes));
console.log("Representatives (blue-green): "+jsts.stringify(representativesBlueGreen));  // only a single representative could be found
