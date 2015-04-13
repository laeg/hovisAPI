var express = require('express');
var router = express.Router();

/** NEO Attributes **/
var db = require('seraph')(); //('http://ip:7474');

/** GP Instantiation **/
var pg = require('pg');
var conString = "postgres://postgres:admin@localhost:5432/GraphAPI";

//var counter = 0;
//var neoNode, gpReturnData;

/* GET users listing. */
router.get('/', function (req, res, next) {
	res.send('respond with a resource');
});


router.get('/nodes/find/all', function (req, res, next) {
	var nodesToFind = {
		name: 'Dave'
	};
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


/***************************
 **	Find by ID
 **	@param
 ***************************/
router.get('/nodes/find/id/:id', function (req, res, next) {
	var resultsArray = [];
	var neoNode, gpNode = {};
	var id = req.params.id;

	db.read(id, function (err, node) {
		if (!err) {
			neoNode = node;
			resultsArray.push(neoNode);
			//res.send(node);

			// get a pg client from the connection pool
			pg.connect(conString, function (err, client, done) {

				var handleError = function (err) {
					// no error occurred, continue with the request
					if (!err) return false;

					// An error occurred, remove the client from the connection pool.
					// A truthy value passed to done will remove the connection from the pool
					// instead of simply returning it to be reused.
					// In this case, if we have successfully received a client (truthy)
					// then it will be removed from the pool.
					done(client);
					res.writeHead(500, {
						'content-type': 'text/plain'
					});
					res.end('An error occurred' + '\n' + err);
					return true;
				};

				// get the total number of visits today (including the current visit)
				client.query('SELECT * FROM api.Users WHERE id = \'' + id + '\'', function (err, result) {

					// handle an error from the query
					if (handleError(err)) return;

					// return the client to the connection pool for other requests to reuse
					done();
					//res.writeHead(200, {
					//	'content-type': 'text/plain'
					//});

					gpReturnData = result.rows[0];
					resultsArray.push(gpReturnData);
					
					if (objectEquals(neoNode, gpReturnData)) {
						console.log('TRUE');
						res.send(resultsArray);
					} else {
						console.log('ITS FUCKED');
						res.send(gpReturnData);
					}
				});

			});

		} else {
			res.send(err);
		}
	});
});

router.get('/nodes/find/label/:label', function (req, res, next) {

	var nodeToFind = {};
	var label = req.params.label;

	var results = [];

	db.find(nodeToFind, false, label, function (err, objs) {
		if (!err) {
			results = objs;
			res.send(results);
		} else {
			res.send(err);
		}

	});

});

router.get('/nodes/greenplum', function (req, res, next) {

	// get a pg client from the connection pool
	pg.connect(conString, function (err, client, done) {

		var handleError = function (err) {
			// no error occurred, continue with the request
			if (!err) return false;

			// An error occurred, remove the client from the connection pool.
			// A truthy value passed to done will remove the connection from the pool
			// instead of simply returning it to be reused.
			// In this case, if we have successfully received a client (truthy)
			// then it will be removed from the pool.
			done(client);
			res.writeHead(500, {
				'content-type': 'text/plain'
			});
			res.end('An error occurred' + '\n' + err);
			return true;
		};

		// record the visit
		client.query('INSERT INTO "api"."visit" (date) VALUES ($1)', [new Date()], function (err, result) {

			// handle an error from the query
			if (handleError(err)) return;

			// get the total number of visits today (including the current visit)
			client.query('SELECT COUNT(date) AS count FROM "api"."visit"', function (err, result) {

				// handle an error from the query
				if (handleError(err)) return;

				// return the client to the connection pool for other requests to reuse
				done();
				res.writeHead(200, {
					'content-type': 'text/plain'
				});
				res.end('You are visitor number ' + result.rows[0].count);
			});
		});
	});
});

module.exports = router;

/***************************
 **	Object Comparison
 ***************************/

function countProps(obj) {
	var count = 0;
	for (k in obj) {
		if (obj.hasOwnProperty(k)) {
			count++;
		}
	}
	return count;
};

function objectEquals(v1, v2) {
	//console.log('YO!')
	//console.log('typeof1' + typeof (v1));
	//console.log('typeof2' + typeof (v2));

	if (typeof (v1) !== typeof (v2)) {
		return false;
		console.log('type false');
	}

	if (typeof (v1) === "function") {
		return v1.toString() === v2.toString();
		console.log('function false');
	}

	if (v1 instanceof Object && v2 instanceof Object) {
		if (countProps(v1) !== countProps(v2)) {
			return false;
			console.log('instance false');
		}
		var r = true;
		for (k in v1) {
			console.log('v1' + v1[k].toString());
			console.log('v2' + v2[k].toString());
			r = objectEquals(v1[k], v2[k]);
			if (!r) {
				return false;

			}
		}
		return true;
	} else {
		return v1 === v2;
	}
}