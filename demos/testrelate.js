var jsts = require("../../computational-geometry");

var factory = new jsts.geom.GeometryFactory();
//
//var lr = factory.createLinearRing(
//	factory.createCoordinates(
//		[{x:0,y:0},{x:0,y:10},{x:10,y:10},{x:10,y:0},{x:0,y:0}]));

c1 = new jsts.geom.Coordinate(0,0);
c2 = new jsts.geom.Coordinate(0,10);
c3 = new jsts.geom.Coordinate(10,10);
c4 = new jsts.geom.Coordinate(10,0);
lr = factory.createLinearRing([c1,c2,c3,c4,c1]);
pol = factory.createPolygon(lr);
var point = factory.createPoint(5,5);

console.log(point.within(pol))     // should be true, returns false
console.log(pol.contains(point))

console.log(point.relate2(lr))    // 
console.log(lr.relate2(point))
