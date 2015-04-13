var express = require('express');
var router = express.Router();
var db = require('seraph')(); //('http://ip:7474');

/** neo4j **/
//var auth = btoa('neo4j:admin');

/* GET users listing. */
router.get('/', function (req, res, next) {
	res.send('respond with a resource');
});

/**router.get('/all', function (req, res, next) {
	//var node = {id: 0};
	console.log('in');

	db.read({
		id: 1
	}, function (err, node) {
		if (err) console.log(err);
		console.log('made it');
		res.send(node);
	});

}); */

router.get('/nodes/find/all', function (req, res, next) {
	var nodesToFind = {name: 'Dave' };
	console.log(nodesToFind);

	/** 
	**	nodesToFind = Attributes to find
	**	true = match on any, false means every node has to have all fields
	**	null = label, or pass label in
	**	callback
	**/
	db.find(nodesToFind, true, null, function (err, objs) {
		console.log(objs);
		console.log(err);
		if (!err) {
			res.send(objs);
		} else {
			res.send(err);
		}
		
	});

});

router.get('/nodes/find/id/:id', function (req, res, next) {
	//var node = {id: 0};

	var id = req.params.id;

	db.read(id, function (err, node) {
		if (!err) {
			res.send(node);
		} else {
			res.send(err);
		}
	});

});

router.get('/nodes/find/label/:label', function (req, res, next) {

	//var node = {id: 0};
	console.log('FINDING!');
	var nodeToFind = {};
	var label = req.params.label;

	var results = [];

	db.find(nodeToFind, false, label, function (err, objs) {
		if (!err) {
			res.send(objs);
		} else {
			res.send(err);
		}
		
	});

});

module.exports = router;