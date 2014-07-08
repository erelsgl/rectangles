/**
 * a unit-test for maximum-disjoint-set based on JSTS.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

var should = require('should');
var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

var South = jsts.Side.South;
var North = jsts.Side.North;
var East  = jsts.Side.East;
var West  = jsts.Side.West;
var Right = jsts.Turn.Right;
var Left = jsts.Turn.Left;

describe('SimpleRectilinearPolygon', function() {
	var srp1 = new jsts.geom.SimpleRectilinearPolygon([0,0, 10,20]);  // rectangle
	var srp2 = new jsts.geom.SimpleRectilinearPolygon([-10,0, 0,10, 10,0, 20,20]); // ח shape
	it('initializes from minimal set of xy values', function() {
		srp1.getCoordinates().should.eql(
			[ { x: 0, y: 0, turn: Left  }, { x: 10, y: 0, turn: Left  }, { x: 10, y: 20, turn: Left }, { x: 0, y: 20, turn: Left },  { x: 0, y: 0, turn: Left } ]);
		srp2.points.should.eql(
			[{x:-10,y:0, turn: Left }, {x:0,y:0, turn: Left }, {x:0,y:10, turn: Right }, {x:10,y:10, turn: Right },{x:10,y:0, turn: Left }, {x:20,y:0, turn: Left }, {x:20,y:20, turn: Left }, {x:-10,y:20, turn: Left }, {x:-10,y:0, turn: Left }]);
	})

	it('knows whether points are internal or external', function() {
		srp1.contains({x:5,y:10}).should.equal(true);
	})
})

