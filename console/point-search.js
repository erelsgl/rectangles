/**
 * Search for a point that gives the required proportionality.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-02
 */
var X_RANGE = Y_RANGE = 400;

var xminWall = -Infinity; //0;//
var xmaxWall = Infinity; // X_RANGE; //
var yminWall = -Infinity; // 0; // 
var ymaxWall = Y_RANGE; //Infinity; // 

var maximumDisjointSet = require("../shared/maximum-disjoint-set");
var makeXYUnique = require("../shared/make-xy-unique");
var squaresTouchingPoints = require("../shared/squares-touching-points");
var pointsToString = require("../shared/points-to-string");

var initial_points = [
  {x:140, y:Y_RANGE},
  {x:180, y:Y_RANGE},
  {x:200, y:Y_RANGE},
  {x:210, y:Y_RANGE},
  {x:230, y:Y_RANGE},
  {x:270, y:Y_RANGE},

  {x:205,y:0},

  {x:231, y:Y_RANGE-20},
  {x:171, y:Y_RANGE-21},
  ];

var points = initial_points.slice(0);
//makeXYUnique(points);
var disjointset = maximumDisjointSet(squaresTouchingPoints(points, xminWall, xmaxWall, yminWall, ymaxWall));
console.log(disjointset.length);

var start=new Date();

var fs = require('fs');
var results = "";
var step = 2;
var minDisjointSetSize = Infinity;
for (var x=100; x<=300; x+=step) {
	for (var y=0; y<=200; y+=step) {
		var points = initial_points.slice(0);
//		points[5].x = x;
//		points[5].y = Y_RANGE-y;
		points[7].x = x;
		points[7].y = Y_RANGE-y;
		points[8].x = X_RANGE-x;
		points[8].y = Y_RANGE-y;
		makeXYUnique(points, xminWall, xmaxWall, yminWall, ymaxWall);
		var disjointset = maximumDisjointSet(squaresTouchingPoints(points, xminWall, xmaxWall, yminWall, ymaxWall));
		results += (x+"\t"+y+"\t"+disjointset.length+"\n");
		if (disjointset.length<minDisjointSetSize)
			minDisjointSetSize = disjointset.length;
	}
}
fs.writeFile("results.dat", results);

var elapsed=new Date()-start;
console.log("minDisjointSetSize="+minDisjointSetSize+" time: "+elapsed+" [ms]");

