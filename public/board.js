jQuery(function ($) {
	if(!$.cookie("name")){
		window.open("/", "__self", false);
	}

	function character(name){
		this.name = name;
		this.positionx = 0;
		this.positiony = 0;
		this.class = "down stand";
	}

	var down = {
		current : "no"
	};
	var up = {
		current : "no"
	};
	var left = {
		current : "no"
	};
	var right = {
		current : "no"
	};

	var socket = io.connect();

	var person = new character($.cookie("name"));
	var imageURL = "./heizackunp2.png";

	var speed = 15;
	var position_x = 0;
	var position_y = 0;

	document.title = "Welcome " + person.name;
	socket.emit('connect', person);

	$(document).keydown(event_handler);
	function event_handler(event){
		event = event || window.event;
		var key = event.which || event.keycode;
		switch(key){
			case 37: walk("left"); break;
			case 38: walk("up"); break;
			case 39: walk("right"); break;
			case 40: walk("down"); break;
			default: break;
		}
	}

	function walk(dir){
		var obj;
		var change_x = 0;
		var change_y = 0;
		switch(dir){
			case "up" : 
				chage_x = 0;
				change_y = -speed;
				obj = up;
				down.current="no";
				left.current="no";
				right.current="no"; 
				break;
			case "down" : 
				change_y = speed; 
				temp_y = 0;
				obj = down; 
				up.current="no";
				left.current="no";
				right.current="no";
				break;
			case "left" : 
				change_x = -speed;
				change_y = 0; 
				obj = left; 
				up.current="no";
				down.current="no";
				right.current="no";
				break;
			case "right" : 
				change_x = speed;
				change_y = 0; 
				obj = right; 
				up.current="no";
				left.current="no";
				down.current="no";
				break;
		}

		position_y = (position_y + change_y) < 0 ? 0 : (position_y + change_y);
		position_x = (position_x + change_x)< 0 ? 0 : (position_x + change_x);
		position_y = (position_y+60) > 600? 540 : position_y;
		position_x = (position_x+30) > 800? 770 : position_x;
		var cur_class;
		switch(obj.current){
			case "no" : cur_class = dir+" stand"; obj.current = "stand1"; break;
			case "stand1" : cur_class = dir+" right_foot"; obj.current = "right";break;
			case "right" :  cur_class = dir+" stand"; obj.current = "stand2";break;
			case "stand2" :  cur_class = dir+" left_foot"; obj.current = "no";break;
		}

		person.class = cur_class;
		person.positionx = position_x;
		person.positiony = position_y;

		socket.emit('move', person);

		$(document).off("keydown");
		setTimeout(function(){$(document).on("keydown", event_handler);},150);
	}

	//text box id: nameTextBox    Character 
	function drawCharacter(c){
		$("#board").append("<p id='"+c.name.replace(/ /g,'')+"TextBox' class='textBox'>"+c.name+"</p><p class='outer' id='"+c.name.replace(/ /g,'')+"Outer'><img src='"+imageURL
			+"' alt='character' class='down stand' id = '"+c.name.replace(/ /g,'')+"Player'/></p>");
		moveCharacter(c);
	}

	function moveCharacter(c){
		var id = "#"+c.name.replace(/ /g,'')+"Outer";
		$("#"+c.name.replace(/ /g,'')+"Player").clearQueue().removeClass().addClass(c.class);
		$(id).clearQueue().animate({top:c.positiony,left:c.positionx},"fast")
		$("#"+c.name.replace(/ /g,'')+"TextBox").clearQueue().animate({top:c.positiony+20-$("#"+c.name.replace(/ /g,'')+"TextBox").height(),left:c.positionx},"fast");
	}

	socket.on('moveChar', function(data){
		moveCharacter(data);
	});

	socket.on('drawChar', function(data){
		drawCharacter(data);
	});

	socket.on('addChar', function(data){
		drawCharacter(data);
	});

	socket.on('removeChar', function(data){
		$("#"+data.name.replace(/ /g,'')+"TextBox").remove();
		$("#"+data.name.replace(/ /g,'')+"Outer").remove();
	});

	$("#say").click(function(){
		var message = $("#text").val();
		if(message != 'Enter your text here'){
			socket.emit('message',{name:person.name, message:message});
		}
	});

	socket.on('addMessage', function(data){
		var $textBox = $("#"+data.name.replace(/ /g,'')+"TextBox");
		var preH = $textBox.height();
		$textBox.clearQueue().text(data.message);
		var height = $textBox.height()-preH;
		var x = parseInt($textBox.css('top'))-height;
		$textBox.css('top',x);
		setTimeout(function(){$textBox.text(data.name); $textBox.css('top',x+height);},4000);
	});
});