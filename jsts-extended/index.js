var jsts = require("jsts");
require("./intersection-utils");
require("./factory-utils");
require("./AxisParallelRectangle");
require("./maximum-disjoint-set");
require("./maximum-disjoint-set-solver");
require("./squares-touching-points");
jsts.stringify = function(object) {
	if (object instanceof Array) {
		return object.map(function(cur) {
			return cur.toString();
		});
	}
	else return object.toString();
}
module.exports = jsts;
