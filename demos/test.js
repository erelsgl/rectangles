var _ = require('underscore')

console.dir(_.min([{x:1,y:2}], function(element) {return element.x}));
console.dir(_.min([{x:-Infinity,y:2}], function(element) {return element.x}));
console.dir(_.min([{x:Infinity,y:2}], function(element) {return element.x}));
