/**
 * a unit-test for rectangles utilities
 * 
 * @author Erel Segal-Halevi
 * @since 2014-01
 */

var should = require('should');
var rectutils = require('../rectutils');

var r0101 = {xmin:0,xmax:1, ymin:0,ymax:1};
var r1212 = {xmin:1,xmax:2, ymin:1,ymax:2};
var r2323 = {xmin:2,xmax:3, ymin:2,ymax:3};
var r3434 = {xmin:3,xmax:4, ymin:3,ymax:4};
var r0202 = {xmin:0,xmax:2, ymin:0,ymax:2};
var r1313 = {xmin:1,xmax:3, ymin:1,ymax:3};
var r2424 = {xmin:2,xmax:4, ymin:2,ymax:4};
var r0303 = {xmin:0,xmax:3, ymin:0,ymax:3};
var r1414 = {xmin:1,xmax:4, ymin:1,ymax:4};
var r0404 = {xmin:0,xmax:4, ymin:0,ymax:4};

var candidateRects = [r0101, r1212, r2323, r3434, r0202, r1313, r2424, r0303, r1414, r0404];

describe('sortedXValues', function() {
	it('works with duplicates', function() {
		rectutils.sortedXValues(candidateRects).should.eql([0,1,2,3,4]);
		rectutils.sortedXValues([r3434,r0101]).should.eql([0,1,3,4]);
	})
})

describe('sortedYValues', function() {
	it('works with duplicates', function() {
		rectutils.sortedYValues(candidateRects).should.eql([0,1,2,3,4]);
		rectutils.sortedXValues([r3434,r0101]).should.eql([0,1,3,4]);
	})
})
