var CronJob = require('cron').CronJob,
    request = require('request'),
    express = require('express'),
  	router = express.Router(),
    mongoose = require('mongoose'),
  	Device = mongoose.model('Device');

module.exports = {

	(function(){
		new CronJob('00 * * * * *', function(){
			var timeOneMinuteAgo = new Date(Date.parse(new Date())-60000);
			var myCache = cache;
			cache = [];
			//rough check to see if cache is populated. will need more integration
			console.log('CronJob Executing');
			if (cache && cache.length > 100){
				//pull down all data points from mongo, where ids are in cache, points are the last minute || points are since last update
				//check to see size of points (10 mb is max for a body post)
				//send with request post 
			}
			else{
				Device.find({}).exec()
				.map(devices, function(box){
						var data = [];
						return Promise.all(box.data.map(function(point){
							if ( point.date > timeNow ) return data.push(date);
						}));
						return myData;
				}).then(function(dataToUpload){
					sendToServer('POST', '/points', dataToUpload);
				}).catch(function(e){
					console.log('error:', e);
				});
			}
		});
	})()

	function sendToServer (method, route, data){
	//method: PUT, POST, GET, DELETE
	//route: exact route to server
	//data: JSON formatted object (will need to be JSON.parse b/c its a string)
	//does it need to be promisified?
		request.post(
			{ method: 'PUT',
			  uri: 'http://ec2-54-152-180-31.compute-1.amazonaws.com' + route, 
			  multipart: [{
			  	'content-type': 'application/json',
			  	body: JSON.stringify(data)
			  }]
			}, function (error, response, body){
					if (response.statusCode == 201 || response.statusCode == 200){
						console.log('data saved to server');
					}
					else {
						console.log('Error:', response.statusCode, error);
						console.log(body);
					}
		});
	}
}



