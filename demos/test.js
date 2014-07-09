var LinkedList = require('jsclass/src/linked_list').LinkedList;

var list = new LinkedList.Doubly.Circular();
var foo = {f:1}, bar = {b:1}, baz = {z:1};
list.push(foo);
list.push(bar);
list.push(baz);

LinkedList.Doubly.Circular.prototype.toString = function() {
	var s = "";
	list.forEach(function(node, i) {
		var sfield = "";
		for (var field in node) {
			if (field!='prev' && field !='next' && field !='list') {
				if (sfield) sfield+=",";
				sfield += field+":"+node[field];
			}
		}

		if (s) s+=", ";
		s +="{"+sfield+"}"
	});
	return "["+s+"]";
}

console.log(list.toString());
