jQuery(function ($) {
	var socket = io.connect();

	var $loginwrap = $("#loginwrap");
	var $registerwrap = $("#registerwrap");
	$registerwrap.hide();
	$("#register").click(function(e){
		e.preventDefault();
		$loginwrap.fadeOut('slow',function(){
			$registerwrap.fadeIn('slow');
		});
	});

	$("#reg_back").click(function(e){
		e.preventDefault();
		$registerwrap.fadeOut('slow',function(){
			$loginwrap.fadeIn('slow');
		});
	});

	$("#reg_submit").click(function(e){
		e.preventDefault();
		socket.emit('new user', 
			{email: $("#reg_email").val(), name:$("#reg_name").val(), password:$("#reg_password").val()},
			function(data){
				if(data){
					$registerwrap.fadeOut('slow',function(){
						$loginwrap.fadeIn('slow');
					});
				}else{
					alert("This Email Address has been registered! Please use another one!");
				}
		});
	});

	$("#loginForm").submit(function(e){
		e.preventDefault();
		socket.emit('login user', 
			{email: $("#email").val(), password:$("#password").val()},
			function(data){
				if(data){
					var url = 'welcome?email='+$("#email").val();
					if($("#remember").is(':checked')){
						url += '&password='+$("#password").val();
					}
					window.open (url,'_self',false);
				}else{
					alert("The user does not exist or the password is wrong.");
				}
		});					
	});

});