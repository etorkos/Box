var express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  Device = mongoose.model('Device');

var cache = [];
module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res, next) {
  console.log('hit something');
  res.json({title: 'Welcome'})
});

router.post('/:id/newdevice', function (req, res, next){
  var id = req.params.id;
  var body = req.body;
  console.log('hit body with:', body);
  //authenticate user
  //post to db
  console.log('Device ',Device);
  Device.create( body , function(error, device) {
    if(error) return next(error);
    else {
      cache[body.name] = device._id;
      res.status(200);
      res.json(device);
    }

  })
  

})

router.put('/:myId/points', function (req, res, next){
  var id = req.params.myId;
  var point = req.body;  

  //post point to db

})
