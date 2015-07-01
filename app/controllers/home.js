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
  Device.findOne({}, function(err, device){
    if (err) next(err);
    else {
      if(device) res.json(device)
      else res.json({title: 'Welcomes'})
    }
  })
});

router.post('/:id/newdevice', function (req, res, next){
  var id = req.params.id;
  var body = req.body; // assume one parameter is id intrinsically given to device, to be cached
  console.log('hit body with:', body);
  //authenticate user session
  Device.findOne({givenID: body.givenID}, function (err, deviceCheck){
    if (err) next(err);
    else if (deviceCheck && deviceCheck._id){
      console.log('server response', deviceCheck);
      res.status(500).send({error: "Device already registered"});
    }
    else {

      Device.create( body , function(error, device) {
        if(error) {
          console.log("error in submit request");
          return next(error);
        }
        else {
          console.log('finshed db submit', device)
          cache[body.givenID] = device.givenID;
          res.status(200);
          res.json(device);
        }
      });
    }
  });
});

router.put('/:myId/points', function (req, res, next){
  var id = req.params.myId;
  var point = req.body;  //expects to have keys givenID, val, and time
  console.log('Hit points', point);
  //authenticate user session
  if( point.givenID && cache[point.givenID]){
    console.log('precached');
    Device.findByIdAndUpdate({"_id": cache[point.givenID]}, {$push: { data: { val: point.val, time: point.time}}}, function (err, confirm){
      if(err) next(err);
      else {
        res.json(confirm);
      }
    });
  }
  else if (point.givenID) {
    Device.findOne({givenID: point.givenID})
    .then(function(error, device){
      if (!device){
        res.status(500).send("Device not registered");
      }
      else {
        device.update({$push: { data: { val: point.val, time: point.time}}}, function(err, confirm){
          if(err) next(err);
          else {
            res.json(confirm);
          }
        })
      }
    }); 
  }
});

router.get('/:myId/points/:devID', function (req, res, next){
  var id = req.params.myId;
  var devID = req.params.devID;
  if( devID && cache[devID]){
    Device.findOne({givenID: point.givenID}, function (err, device){
      if(err) next(err);
      else {
        console.log('finshed Find with ', device);
        res.json(device);
      }
    })
  }
});
