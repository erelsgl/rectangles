var maximumDisjointSet = require('../shared/maximum-disjoint-set');
var _ = require('underscore');

candidates=[
            {"xmin":-70,"ymin":110,"xmax":140,"ymax":320},
            {"xmin":90,"ymin":210,"xmax":200,"ymax":320},
            {"xmin":100,"ymin":110,"xmax":200,"ymax":210},
            {"xmin":140,"ymin":130,"xmax":220,"ymax":210},
            {"xmin":200,"ymin":130,"xmax":280,"ymax":210},
            {"xmin":200,"ymin":130,"xmax":280,"ymax":210},
            ]
console.dir(maximumDisjointSet(candidates)); // should contain 3 rectangles.
