var express = require('express'),
  router = express.Router(),
  request = require('request');


exports.sendToServer = function (method, route, data){
  //method: PUT, POST, GET, DELETE
  //route: exact route to server
  //data: JSON formatted object (will need to be JSON.parse b/c its a string)
  //does it need to be promisified?
    console.log('data to be uploaded', data);
    request.post(
      { uri: 'http://ec2-52-6-65-109.compute-1.amazonaws.com:' + route, 
        body: data,
        json: true
      }, function (error, response, body){
        console.log('err', error, 'response', response.statusCode, response.statusMessage, 'body', body);
          if (response.statusCode == 201 || response.statusCode == 200){
            console.log('data saved to server');
            return body;
          }
          else {
            console.log('Error:', response.statusCode, error);
            console.log(body);
            return error;
          }
    });
  }

exports.sendAlertToServer = function(){ 
  	console.log("ALERT!!!!!");
}