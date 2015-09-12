// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var morgan      = require('morgan');
var config      = require('./config');
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
app.set('superSecret', config.secret); // secret variable



var Thing     = require('./models/thing');
var User   = require('./models/user'); // get our mongoose model


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 5000;        // set our port

var mongoose   = require('mongoose');
mongoose.connect('mongodb://mongodb:27017/databasetest'); // connect


// ROUTES FOR OUR API
// =============================================================================

app.use(morgan('dev'));

var router = express.Router();              // get an instance of the express Router

router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});


	
router.route('/things')

    // create a thing (accessed at POST http://localhost:5000/api/things)
    .post(function(req, res) {
        var thing = new Thing();      // create a new instance of the thing model
        thing.name = req.body.name;  // set the things name (comes from the request)
        // save the thing and check for errors
        thing.save(function(err) {
            if (err) res.send(err);
            res.json({ message: 'Thing created!' });
        })
    })
	// get all the things (accessed at GET http://localhost:8080/api/things)
    .get(function(req, res) {
        Thing.find(function(err, things) {
            if (err)
                res.send(err);

            res.json(things);
        });
    });


router.route('/things/:thing_id')

    // get the thing with that id (accessed at GET http://localhost:8080/api/things/:thing_id)
    .get(function(req, res) {
        Thing.findById(req.params.thing_id, function(err, thing) {
            if (err)
                res.send(err);
            res.json(thing);
        });
    })
    // update the Thing with this id (accessed at PUT http://localhost:8080/api/Things/:Thing_id)
    .put(function(req, res) {

        // use our Thing model to find the Thing we want
        Thing.findById(req.params.thing_id, function(err, thing) {
            if (err) res.send(err);
            thing.name = req.body.name;  // update the Things info
            // save the Thing
            thing.save(function(err) {
                if (err) res.send(err);
                res.json({ message: 'Thing updated!' });
            });

        });
    })
    // delete the bear with this id (accessed at DELETE http://localhost:8080/api/bears/:bear_id)
    .delete(function(req, res) {
        Thing.remove({
            _id: req.params.thing_id
        }, function(err, thing) {
            if (err)
                res.send(err);
            res.json({ message: 'Successfully deleted' });
        });
    });

router.route('/setup')

	.post(function(req, res) {
	  // create a sample user
		console.log(req.body);
	  var newuser = new User({ 
	    username: req.body.username, 
	    password: req.body.password,
	    admin: true 
	  });

	  // save the sample user
	  newuser.save(function(err) {
	    if (err) throw err;

	    console.log('User saved successfully');
	    res.json({ success: true });
	  });
	});



// route to authenticate a user (POST http://localhost:8080/api/authenticate)
router.route('/authenticate')
	.post(function(req, res) {

	  // find the user
	  User.findOne({
	    username: req.body.username
	  }, function(err, user) {

	    if (err) throw err;

	    if (!user) {
	      res.json({ success: false, message: 'Authentication failed. User not found.' });
	    } else if (user) {

	      // check if password matches
	      if (user.password != req.body.password) {
		res.json({ success: false, message: 'Authentication failed. Wrong password.' });
	      } else {

		// if user is found and password is right
		// create a token
		var token = jwt.sign(user, app.get('superSecret'), {
		  expiresInMinutes: 1440 // expires in 24 hours
		});

		// return the information including token as JSON
		res.json({
		  success: true,
		  message: 'Enjoy your token!',
		  token: token
		});
	      }   

	    }

	  });
	});

router.use(function(req, res, next) {

	  // check header or url parameters or post parameters for token
	  var token = req.body.token || req.query.token || req.headers['x-access-token'];

	  // decode token
	  if (token) {

	    // verifies secret and checks exp
	    jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
	      if (err) {
		return res.json({ success: false, message: 'Failed to authenticate token.' });    
	      } else {
		// if everything is good, save to request for use in other routes
		req.decoded = decoded;    
		next();
	      }
	    });

	  } else {

	    // if there is no token
	    // return an error
	    return res.status(403).send({ 
		success: false, 
		message: 'No token provided.' 
	    });
	    
	  }
	});

router.route('/users')
	.get(function(req, res) {
	  User.find({}, function(err, users) {
	    res.json(users);
	  });
    	});

router.route('/users/:user_id')
        .get(function(req, res) {
          User.find({_id:res.paramas.user_id}, function(err, user) {
            res.json(user);
          });
        })
        .delete(function(req, res) {
                id = req.params.user_id;
                console.log("delete " + req.params.user_id);
                if (id){
                        console.log("User is going to be deleted : " + id);
                        User.remove({
                                _id: id
                        }, function(err, thing) {
                                if (err)
                                res.send(err);
                                res.json({ message: 'Successfully deleted' });
                        });
                        } else {
                                console.log("please enter valid id to delete");
                                res.json("message: 'ID ERROR'");
                        }
        });


// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});
router.get('/api',function(req,res){
res.send('Hello world');
});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
