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
	
	it('a hovering square', function() {
		var initialCorners = [{x:0,y:Infinity},{x:0,y:2},{x:2,y:2},{x:2,y:0},{x:10,y:0},{x:10,y:Infinity}];
		updatedCornersNorth(initialCorners, {minx:6,miny:6,maxx:8,maxy:8}).should.eql(
				[{x:0,y:Infinity},{x:0,y:2},{x:2,y:2},{x:2,y:0},{x:6,y:0},{x:6,y:8},{x:8,y:8},{x:8,y:0},{x:10,y:0},{x:10,y:Infinity}]);
		updatedCornersNorth(initialCorners, {minx:6,miny:6,maxx:10,maxy:10}).should.eql(
			[{x:0,y:Infinity},{x:0,y:2},{x:2,y:2},{x:2,y:0},{x:6,y:0},{x:6,y:10},{x:10,y:10},{x:10,y:Infinity}]);
	})
})

//var calculateSpansOfLevels = jsts.algorithm.calculateSpansOfLevels;
//var xFarWest = 0;  var xFarEast = 1;
//describe.only('calculateSpansOfLevels', function() {
//	it('simple initial level set', function() {
//		calculateSpansOfLevels([{x:0,y:0}], xFarWest, xFarEast).should.eql(
//			[{x:0,y:0,xw:0,xe:1}]);
//	})
//})
//


var rectanglesCoveringSouthernLevels = jsts.algorithm.rectanglesCoveringSouthernLevels;
describe('rectanglesCoveringSouthernLevels', function() {
	it('single level', function() {
		rectanglesCoveringSouthernLevels([{y:0,minx:0,maxx:1}]).should.eql(
			[{minx:0,maxx:1,miny:0,maxy:Infinity}]);
	})
	it('two levels 01', function() {
		rectanglesCoveringSouthernLevels([{y:0,minx:0,maxx:1}, {y:1,minx:1,maxx:2}]).should.eql(
			[{minx:0,maxx:1,miny:0,maxy:1}, {minx:0,maxx:2,miny:1,maxy:Infinity}]);
	})
	it('two levels 10', function() {
		rectanglesCoveringSouthernLevels([{y:1,minx:0,maxx:1}, {y:0,minx:1,maxx:2}]).should.eql(
			[{minx:1,maxx:2,miny:0,maxy:1}, {minx:0,maxx:2,miny:1,maxy:Infinity}]);
	})
	it('three levels 012', function() {
		rectanglesCoveringSouthernLevels([{y:0,minx:0,maxx:1}, {y:1,minx:1,maxx:2}, {y:2,minx:2,maxx:4}]).should.eql(
			[{minx:0,maxx:1,miny:0,maxy:1}, {minx:0,maxx:2,miny:1,maxy:2}, {minx:0,maxx:4,miny:2,maxy:Infinity}]);
	})
	it('three levels 102', function() {
		rectanglesCoveringSouthernLevels([{y:1,minx:0,maxx:1}, {y:0,minx:1,maxx:2}, {y:2,minx:2,maxx:4}]).should.eql(
			[{minx:1,maxx:2,miny:0,maxy:1}, {minx:0,maxx:2,miny:1,maxy:2}, {minx:0,maxx:4,miny:2,maxy:Infinity}]);
	})
	it('three levels 021', function() {
		rectanglesCoveringSouthernLevels([{y:0,minx:0,maxx:1}, {y:2,minx:1,maxx:2}, {y:1,minx:2,maxx:4}]).should.eql(
			[{minx:0,maxx:1,miny:0,maxy:2}, {minx:2,maxx:4,miny:1,maxy:2}, {minx:0,maxx:4,miny:2,maxy:Infinity}]);
	})
	it('three levels 201', function() {
		rectanglesCoveringSouthernLevels([{y:2,minx:0,maxx:1}, {y:0,minx:1,maxx:2}, {y:1,minx:2,maxx:4}]).should.eql(
			[{minx:1,maxx:2,miny:0,maxy:1}, {minx:1,maxx:4,miny:1,maxy:2}, {minx:0,maxx:4,miny:2,maxy:Infinity}]);
	})
	it('three levels 210', function() {
		rectanglesCoveringSouthernLevels([{y:2,minx:0,maxx:1}, {y:1,minx:1,maxx:2}, {y:0,minx:2,maxx:4}]).should.eql(
			[{minx:2,maxx:4,miny:0,maxy:1}, {minx:1,maxx:4,miny:1,maxy:2}, {minx:0,maxx:4,miny:2,maxy:Infinity}]);
	})
	it('three levels 120', function() {
		rectanglesCoveringSouthernLevels([{y:1,minx:0,maxx:1}, {y:2,minx:1,maxx:2}, {y:0,minx:2,maxx:4}]).should.eql(
			[{minx:2,maxx:4,miny:0,maxy:2}, {minx:0,maxx:1,miny:1,maxy:2}, {minx:0,maxx:4,miny:2,maxy:Infinity}]);
	})
})


var updatedLevels = jsts.algorithm.updatedLevels;
describe('updatedLevels', function() {
	it('single level', function() {
		var levels = [{"y":0,"minx":0,"maxx":1}];
		var landplot = {"minx":0,"miny":0,"maxx":0.75,"maxy":0.75};
		updatedLevels(levels,landplot,"S").should.eql([{"y":0.75,"minx":0,"maxx":0.75},{"y":0,"minx":0.75,"maxx":1}]);
	})
	it('zero-sized plot at south', function() {
		var levels = [{"y":0,"minx":0,"maxx":1}];
		var landplot = {"minx":0,"miny":0,"maxx":0,"maxy":0};
		updatedLevels(levels,landplot,"S").should.eql(levels);
	})
	it('zero-sized plot at north', function() {
		var levels = [{"y":0,"minx":0,"maxx":1}];
		var landplot = {"minx":1,"miny":0,"maxx":1,"maxy":0};
		updatedLevels(levels,landplot,"S").should.eql(levels);
	})
});

