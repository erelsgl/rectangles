rectangles
==========

Utilities related to collections of rectangles.

## Folder structure

* jsts-extended/ - Code that extends the JSTS library. In particular:
	* maximum-disjoint-set - find a largest set of non-overlapping shapes from a given collection of candidates.
	* squares-touching-points - find a set of candidate shapes spanned by a given set of points.
* client/ - An HTML demo application and supporting Javascript files running on a web-client only.
	* A certain version of the web application can be seen [here](http://tora.us.fm/math/rectangles/client/svgdisjointsquares.html).
* console/ - A Node.js demo console application.
* test/ - Mocha tests.

## License
LGPL 3.
