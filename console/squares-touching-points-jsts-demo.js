var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

var p1 = {x:0,y:0};
var p2 = {x:3,y:1};
var p3 = {x:3,y:0};
var p4 = {x:3,y:-1};

console.log("\nAxis-parallel squares:\n----------------\n")
console.log(jsts.stringify(factory.createSquaresTouchingPoints([p1,p2])));
console.log(jsts.stringify(factory.createSquaresTouchingPoints([p1,p3])));
console.log(jsts.stringify(factory.createSquaresTouchingPoints([p1,p4])));

console.log("\nRotated squares:\n----------------\n")
console.log(jsts.stringify(factory.createRotatedSquaresTouchingPoints([p1,p2])));
console.log(jsts.stringify(factory.createRotatedSquaresTouchingPoints([p1,p3])));
console.log(jsts.stringify(factory.createRotatedSquaresTouchingPoints([p1,p4])));
