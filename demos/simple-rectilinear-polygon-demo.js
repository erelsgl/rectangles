var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

var srp = new jsts.geom.SimpleRectilinearPolygon([0,0,100,100]);
console.dir(srp.getCoordinates());
