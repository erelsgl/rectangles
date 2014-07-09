//var DoublyLinkedList = require('listish').DoublyLinkedList;
//var list = new DoublyLinkedList();
//for (var i=0; i<4; ++i)
//	list.append(i);
//for (var i in list.__iterator__())
//	console.dir(i);
//process.exit(1);

var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

var srp = new jsts.geom.SimpleRectilinearPolygon([0,0,100,100]);
console.dir(srp.getCoordinates());
console.log(srp.corners.toString());
console.log(srp.segments.toString());

