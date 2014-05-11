/**
 * a unit-test for the algorithms for updating lists of corners.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var should = require('should');
var jsts = require("../jsts-extended");
var updatedCornersNorth = jsts.algorithm.updatedCornersNorth; // shorthand

describe('updatedCornersNorth', function() {
	it('simple initial corner set', function() {
		var initialCorners = [{x:0,y:20},{x:0,y:0},{x:10,y:0},{x:10,y:20}];
		updatedCornersNorth(initialCorners, {minx:0,miny:0,maxx:5,maxy:5}).should.eql(
			[{x:0,y:20},{x:0,y:5},{x:5,y:5},{x:5,y:0},{x:10,y:0},{x:10,y:20}]);
		updatedCornersNorth(initialCorners, {minx:5,miny:0,maxx:10,maxy:5}).should.eql(
			[{x:0,y:20},{x:0,y:0},{x:5,y:0},{x:5,y:5},{x:10,y:5},{x:10,y:20}]);
		//console.log(JSON.stringify(updatedCornersNorth(initialCorners, {minx:0,miny:0,maxx:5,maxy:5})).replace(/\"/g,""));
	})
	
	it('8 initial corners', function() {
		var initialCorners = [{x:0,y:Infinity},{x:0,y:2},{x:2,y:2},{x:2,y:0},{x:8,y:0},{x:8,y:2},{x:10,y:2},{x:10,y:Infinity}];
		updatedCornersNorth(initialCorners, {minx:0,miny:2,maxx:1,maxy:3}).should.eql(
			[{x:0,y:Infinity},{x:0,y:3},{x:1,y:3},{x:1,y:2},{x:2,y:2},{x:2,y:0},{x:8,y:0},{x:8,y:2},{x:10,y:2},{x:10,y:Infinity}]);
		updatedCornersNorth(initialCorners, {minx:0,miny:2,maxx:2,maxy:4}).should.eql(
			[{x:0,y:Infinity},{x:0,y:4},{x:2,y:4},{x:2,y:0},{x:8,y:0},{x:8,y:2},{x:10,y:2},{x:10,y:Infinity}]);
		updatedCornersNorth(initialCorners, {minx:0,miny:2,maxx:3,maxy:5}).should.eql(
			[{x:0,y:Infinity},{x:0,y:5},{x:3,y:5},{x:3,y:0},{x:8,y:0},{x:8,y:2},{x:10,y:2},{x:10,y:Infinity}]);
		updatedCornersNorth(initialCorners, {minx:0,miny:2,maxx:8,maxy:10}).should.eql(
			[{x:0,y:Infinity},{x:0,y:10},{x:8,y:10},{x:8,y:2},{x:10,y:2},{x:10,y:Infinity}]);
		updatedCornersNorth(initialCorners, {minx:0,miny:2,maxx:9,maxy:11}).should.eql(
			[{x:0,y:Infinity},{x:0,y:11},{x:9,y:11},{x:9,y:2},{x:10,y:2},{x:10,y:Infinity}]);
		updatedCornersNorth(initialCorners, {minx:0,miny:2,maxx:10,maxy:12}).should.eql(
			[{x:0,y:Infinity},{x:0,y:12},{x:10,y:12},{x:10,y:Infinity}]);
	})
	
	it('a flying square', function() {
		var initialCorners = [{x:0,y:Infinity},{x:0,y:2},{x:2,y:2},{x:2,y:0},{x:10,y:0},{x:10,y:Infinity}];
		updatedCornersNorth(initialCorners, {minx:6,miny:6,maxx:8,maxy:8}).should.eql(
				[{x:0,y:Infinity},{x:0,y:2},{x:2,y:2},{x:2,y:0},{x:6,y:0},{x:6,y:8},{x:8,y:8},{x:8,y:0},{x:10,y:0},{x:10,y:Infinity}]);
		updatedCornersNorth(initialCorners, {minx:6,miny:6,maxx:10,maxy:10}).should.eql(
			[{x:0,y:Infinity},{x:0,y:2},{x:2,y:2},{x:2,y:0},{x:6,y:0},{x:6,y:10},{x:10,y:10},{x:10,y:Infinity}]);
	})
})

