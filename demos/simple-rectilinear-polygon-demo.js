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
console.dir(JSON.stringify(srp.segments));

for (var i=srp.segments.begin(); i!=srp.segments.end(); i=i.next) {
	console.dir(i.data);
}

