var dependencyTree = {};

function isArray(o) {
    return Object.prototype.toString.call(o) === '[object Array]';
}

var mixArray = function (a, b) {
	if (isArray(a) && isArray(b)) {
		for (var i = 0; i < b.length; i++) {
			if (a.indexOf(b[i]) < 0) {
				a.push(b[i]);
			}
		}
		return a;
	} else {
		console.log('It is not an array!');
	}
};

module.exports = {
    add: function(mod, root) {
        if (dependencyTree[mod]) {
            if (dependencyTree[mod].indexOf(root) < 0) {
                dependencyTree[mod] = mixArray(dependencyTree[mod], this.getRoot(root));
            }
        } else {
            dependencyTree[mod] = mixArray([], this.getRoot(root) ? this.getRoot(root) : [root]);
        }
    },
    getRoot: function(mod) {
        return dependencyTree[mod];
    }
}
