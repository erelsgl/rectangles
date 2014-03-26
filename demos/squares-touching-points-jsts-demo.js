var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

var p1 = {x:100,y:100};
var p2 = {x:150,y:30};
var p3 = {x:200,y:100};

console.log("\nAxis-parallel squares:\n----------------\n")
console.log(jsts.stringify(factory.createSquaresTouchingPoints([p1,p2])));
console.log(jsts.stringify(factory.createSquaresTouchingPoints([p1,p3])));
console.log(jsts.stringify(factory.createSquaresTouchingPoints([p1,p2,p3])));

console.log("\nRotated squares:\n----------------\n")
console.log(jsts.stringify(factory.createRotatedSquaresTouchingPoints([p1,p2])));
console.log(jsts.stringify(factory.createRotatedSquaresTouchingPoints([p1,p3])));
console.log(jsts.stringify(factory.createSquaresTouchingPoints([p1,p2,p3])));
