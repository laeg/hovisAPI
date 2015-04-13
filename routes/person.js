var express = require('express');
var router = express.Router();

/** NEO Attributes **/
var db = require('seraph')(); //('http://ip:7474');

/** GP Instantiation **/
var pg = require('pg');
var conString = "postgres://postgres:admin@localhost:5432/GraphAPI";


/****************************
 **	Check point - API working
 ****************************/
router.get('/', function (req, res, next) {
	res.send('People API working');
});


/****************************
 **	Find by ID
 **	@param
 ****************************/
router.get('/nodes/find/id/:id', function (req, res, next) {
	// Result array to return
	var resultsArray = [];

	// Neo & GP objects
	var neoNode, gpNode = {};

	// Required ID
	var id = req.params.id;

	// Read Neo for result
	db.read(id, function (err, node) {
		if (!err) {
			// Push the Neo results onto the stack
			neoNode = node;
			resultsArray.push({
				neo: neoNode
			});

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
					if (handleError(err)) {
						console.log(err);
						console.log('I think tis is harry');
						res.send(resultsArray);
					};

					// return the client to the connection pool for other requests to reuse
					done();

					// If the results are present 
					// push the GP results into array
					// or just populate with not found
					console.log(result.rows[0]);
					if (result.rows[0] === null || typeof result.rows[0] === 'undefined') {
						gpReturnData = {
							gp: { data: 'Not found'}
						};
						resultsArray.push(gpReturnData);

					} else {
						gpReturnData = result.rows[0];

						resultsArray.push({
							gp: gpReturnData
						});
					}

					// Need to do something clever around this????
					if (objectEquals(neoNode, gpReturnData)) {
						res.send(gpReturnData);
					} else {
						res.send(resultsArray);
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


module.exports = router;

/***************************
 **	JSON Object Comparison
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

	if (typeof (v1) !== typeof (v2)) {
		return false;
	}

	if (typeof (v1) === "function") {
		return v1.toString() === v2.toString();
	}

	if (v1 instanceof Object && v2 instanceof Object) {
		if (countProps(v1) !== countProps(v2)) {
			return false;
		}
		var r = true;
		for (k in v1) {
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