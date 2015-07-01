var express = require("express");

module.exports = function (app) {
	auth = express.basicAuth(function(username,password,callback){
        var cipher = crypto.createCipher('aes-256-cbc', 'salt');
        cipher.update(password, 'utf8', 'base64');
        var result = ((username === 'username') && (cipher.final('base64') === 'stored_password'));
        callback(null, result);
    });
}
	