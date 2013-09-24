var express = require("express"),
	app = express(),
	server = require("http").createServer(app),
	io = require("socket.io").listen(server),
	mongoose = require("mongoose"),
	path = require("path");

var persons = new Array();
var sockets = new Array();

io.configure(function(){
	io.set("transports", ["xhr-polling"]);
	io.set("polling duration",10);
});

app.configure(function(){
	app.set('port', process.env.PORT||8888);
	app.set('views', __dirname + '/views');
	//app.engine('html', require('ejs').renderFile);
	app.set('view engine','ejs');

	app.use(express.cookieParser());
	app.use(express.session({secret: 'secret'}));
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(express.favicon());
	///app.use(app.router);
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
});

mongoose.connect('mongodb://fengzeyu:ilywangyan0312@paulo.mongohq.com:10098/game', function(err){
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
		console.log("There is a session "+req.session.email+"   "+req.session.password);
		res.render('index.ejs',{email:req.session.email, password:req.session.password});
	}else{
		console.log("There is no session");
		res.render('index.ejs',{email:'', password:''});
	}
});

app.get('/welcome', function(req, res){
	res.render('welcome.ejs',{title:'Welcome'});
});

app.post('/save', function(req, res){
	if(req.body.email && req.body.password){
		console.log('save session '+req.body.email+'   '+req.body.password);
		req.session.email = req.body.email;
		req.session.password = req.body.password;
	}
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
				for(var i = 0; i < persons.length; i++){
					if(docs[0].name == persons[i].name){
						callback(false);
						return;
					}
				}
				callback(docs[0].name);
			}
		});
	});

	socket.on('connect', function(data){
		socket.name = data.name;
		sockets.push(socket);

		console.log("new user connected");
		for(var i = 0; i < sockets.length; i++){
			sockets[i].emit('drawChar',data);
		}

		for(var i = 0; i < persons.length; i ++){
			socket.emit('addChar',persons[i]);
		}

		persons.push(data);
	});

	socket.on('move',function(data,callback){
		for(var i = 0 ; i < persons.length; i++){
			if(persons[i].name = data.name){
				persons[i] = data;
				break;
			}
		}

		for(var i = 0; i < sockets.length; i++){
			sockets[i].emit('moveChar', data);
		}
	});


	//when disconnect, sent new usernames to client
	socket.on('disconnect', function(data){
		if(!socket.name) return;
		console.log("disconnect "+socket.name);
		for(var i = 0; i < sockets.length; i ++){
			if(sockets[i].name==socket.name){
				sockets.splice(i,1);
				for(var j = 0; j < sockets.length; j++){
					sockets[j].emit('removeChar', persons[i]);
				}
				persons.splice(i,1);
				break;
			}
		}
	});

	socket.on('message',function(data){
		console.log('recieve message from '+data.name+' : '+data.message);
		for(var i = 0; i < sockets.length; i++){
			sockets[i].emit('addMessage',data);
		}
	});

});
