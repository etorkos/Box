var express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  Device = mongoose.model('Device'),
  Promise = require('bluebird'),
  Rule = mongoose.model('Rule'),
  CronJob = require('cron').CronJob,
  ServerComm = require('./serverComm');

var cache = {};

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
  // //Refactoring into promises
  // var device; //holder for promise chain
  // var promise;
  // var ruleId;
  //authenticate user session
  // if( point.givenID && cache[point.givenID]){
  //   device = Device.findById({"_id": cache[point.givenID]});
  //   promise = device.update({$push: { data: { val: Number(point.val), time: point.time}}}).exec();
  //   console.log('precached');
  // }
  // else if (point.givenID){
  //   device = Device.findOne({givenID: point.givenID});
  //   promise = device.update({$push: { data: { val: Number(point.val), time: point.time}}}).exec();
  //   console.log('not cached');
  //   //cache[point.givenID] = device._id;
  // }
  // else {
  //   res.status(404).send("Device ID not supplied");
  // }
  // promise.then(function(confirm){
  //     console.log("update,", confirm,"into check section -\-\-\-\-\-\-\-\-\- ");
  //     if(ruleId){
  //       inAllowableRange(point, ruleId);
  //       res.status(201).send("Success");
  //     }
  //     else{
  //       res.status(201).send("Success");
  //     }
  // }).then(null, function(e){
  //   console.log("ERROR", e);
  //   res.status(500).send(e);
  // });

  Device.findOne({givenID: point.givenID}, function(err, doc){
    // console.log('doc', doc)
    if(doc){
      doc.update({$push: { data: { val: Number(point.val), time: point.time}}}, function(err, confirm){
        // console.log('confirm', confirm);
        if(err) next(err);
        else{
          if(doc.rule){
            inAllowableRange(point, doc.rule);
            res.status(201).send("success");
          }
          else res.status(201).send("success");
        }
      });
    }

  });
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


function inAllowableRange (point, id){
  //wants rule_id and point values
  return Rule.findById(id)
    .then(function(alert){
      if(alert.topBound && point.val > alert.topBound) throw new Error(point.name, "is above the acceptable range");
      else if(alert.bottomBound && point.val < alert.bottomBound) throw new Error(point.name, "is above the below range");
      else return allowablePromise.resolve();
    }).then(null, function(e){
      //send off command to send an alert to server
      ServerComm.sendAlertToServer();
    });
}

var serverUpload =  new CronJob({
    cronTime: '00 * * * * *', 
    onTick: function(){
      var timeOneMinuteAgo = new Date(Date.parse(new Date())-60000);
      var timeTenMinutesAgo = new Date(Date.parse(new Date())-600000);
      var myCache = cache;
      //rough check to see if cache is populated. will need more integration
      console.log('CronJob Executing', cache);
      // cache = [];
      if (cache && cache.length > 100){
        console.log('cache validated');
        //pull down all data points from mongo, where ids are in cache, points are the last minute || points are since last update
        //check to see size of points (10 mb is max for a body post)
        //send with request post 
      }
      else{
        var devices = Device.find({}).exec();
        Promise.map( devices, function(box){
            var data = []; //assumes there is already something in DB
            box.data.forEach(function(point){
              if ( Date.parse(point.time) > Date.parse(timeTenMinutesAgo) ) data.push(point);
            });
            return {dis: box.dis, data: data};
        }).then(function(dataToUpload){
          if(dataToUpload.length < 1) throw new Error('No devices to upload');
          else{
            dataToUpload.forEach(function(deviceData, index){
              if(deviceData.data.length > 0){
                ServerComm.sendToServer('POST', '1337/', deviceData);
              }
              else { 
              }
            });
          }
        }).catch(function(e){
          console.log('error:', e);
        });
      }
    }, 
    start: false,
    context: cache });

