var express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  Device = mongoose.model('Device'),
  Rule = mongoose.model('Rule');
var cache = [];

module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res, next) {
  res.send("welcome");
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



router.get(':myId/rules', function (req, res, next){
  Rule.find({}).exec()
  .then(function(rules){
    res.json(rules);
  }).catch(function(e){
    res.status(500).send(e);
  });
});

router.post('/:myId/rule', function (req, res, next){
  var id = req.params.myId;
  var body = req.body;
  if(body.sensorType && body.name){ //body must have name and type parameters and 
    var request = {sensorType: body.sensorType, name: body.name};
    if(body.topBound) request.topBound = body.topBound;
    if(body.bottomBound) request.bottomBound = body.bottomBound;
    //check if rule already exists, make a new rule, add rule to device
    Rule.findOne({name: body.name}).exec()
    .then( function ( findOne ){
      console.log(findOne);
      if(!findOne) return Rule.create(request).exec();
      else throw "Rule already in Database";
    }).then(function(createdRule){
      res.send("rule created");
    }).catch(function(e){
      res.status(500).send(e);
    })
  }
  else {
    res.status(400).send("Need to include sensorType and name in rule post");
  }
});

router.put('/:myId/assign', function (req, res, next){
    //assign rule to a device
    var rule = req.body.ruleName;
    var deviceName = req.body.deviceName;

    Rule.find({name: rule}).exec()
    .then(function(rule){
      if(!rule) throw "rule is not defined";
      else return Device.findOne({name: deviceName}).exec();
    }).then(function(device){
      if(!device) throw "device is not defined";
      else {
        device.rule = rule._id;
        return device.save().exec();
      }
    }).then(function(save){
      if(!save) throw "error saving";
      else res.status(201).send('Rule applied for', device.name);
    }).catch(function(e){
      res.status(500).send(e);
    })
})
