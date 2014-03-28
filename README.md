rectangles
==========

Utilities related to collections of rectangles.

## Folder structure

* jsts-extended/ - Code that extends the JSTS library. In particular:
	* maximum-disjoint-set-sync - a function that finds a largest set of non-overlapping shapes from a given collection of candidates.
	* maximum-disjoint-set-async - same function in a class that enables asynchronous interrupting ("any-time algorithm").
	* representative-disjoint-set-sync - finds a largest set of representative shapes from a given set of collections.
	* shapes-touching-points - find a set of candidate shapes spanned by a given set of points.
	* AxisParallelRectangle - a specialized geometric shape that supports faster operations.
* client/ - An HTML demo application and supporting Javascript files running on a web-client only.
	* A certain version of the web application can be seen [here](http://tora.us.fm/math/rectangles/client/svgdisjointsquares.html).
* demos/ - Some Node.js console applications for demonstrating the algorithms.
* test/ - Mocha tests.

## License
LGPL 3.
