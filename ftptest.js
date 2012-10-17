var ftpupload = require("./ftpupload");


ftpupload.upload({
	dirname:"__cortex_tmp",
	remotedir:"__cortex_tmp",
	username:"username",
	password:"password",
	host:"hostname",
	port:21
},function(){
	console.log("next stuff");
});