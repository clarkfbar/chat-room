var express = require("express"),
	app = express(),
	server = require("http").createServer(app),
	io = require("socket.io").listen(server),
	mongoose = require("mongoose"),
	path = require("path");

app.configure(function(){
	app.set('port', 8888);
	app.set('views', __dirname + '/views');
	//app.engine('html', require('ejs').renderFile);
	app.set('view engine','ejs');

	app.use(express.cookieParser());
	app.use(express.session({secret: 'secret'}));
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(express.favicon());
	app.use(app.router);
	app.use(express.logger('dev'));
});

mongoose.connect('mongodb://localhost/reg', function(err){
	if(err){
		console.log(err);
	}else{
		console.log('connect to mongodb');
	}
});

var regSchema = mongoose.Schema({
	email: String,
	name: String,
	password: String
});

var reg = mongoose.model('register', regSchema);

server.listen(app.get('port'), function(){
	console.log("Express server listening on port "+app.get('port'));
});

app.get('/', function(req, res){
	if(req.session.email){
		res.render('index.ejs',{email:req.session.email, password:req.session.password});
	}else{
		res.render('index.ejs',{email:'', password:''});
	}
});

app.get('/welcome', function(req, res){
	if(req.query.email && req.query.password){
		console.log('save session '+req.query.email+'   '+req.query.password);
		req.session.email = req.query.email;
		req.session.password = req.query.password;
	}
	var query = reg.find({email:req.query.email}, function(err, docs){
		res.render('welcome.ejs', {title: 'Hello '+ docs[0].name});
	});
});

io.sockets.on('connection', function(socket){
	socket.on('new user', function(data, callback){
		var query = reg.find({email:data.email}, function(err, docs){
			if(!err && docs.length==0){
				reg.find({name:data.name}, function(err,docs){
					if(docs.length!=0){
						callback(false);
					}else{
						callback(true);
						console.log("new user added");
						var newreg = new reg({email:data.email, name:data.name, password:data.password});
						newreg.save(function(err){
							if(err) throw err;
							else
								console.log("new user "+data.email);
						});
					}
				});
			}
			else callback(false);
		});
	});

	socket.on('login user', function(data, callback){
		var query = reg.find({email:data.email}, function(err, docs){
			console.log("email "+ docs[0].email + " password"+docs[0].password);
			if(err || docs.length==0 || docs[0].password != data.password){
				callback(false);
			}
			else{
				callback(docs[0].name);
			}
		});
	});
});
