var express = require('express'),
  router = express.Router(),
  request = require('request'),
  mongoose = require('mongoose'),
  Device = mongoose.model('Device'),
  Promise = require('bluebird'),
  Rule = mongoose.model('Rule'),
  CronJob = require('cron').CronJob;

  

var cache = {};
// serverUpload.start();
// var cron = require('./cron.js').cronJob;
//   cron.start();

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

router.get(':myId/rules', function (req, res, next){
  Rule.find({}).exec()
  .then(function(rules){
    res.json(rules);
  }).then(null, function(e){
    res.status(500).send(e);
  });
});

//sending out a 500 error
router.post('/:myId/rule', function (req, res, next){
  var id = req.params.myId;
  var body = req.body;
  if(body.sensorType && body.name){ //body must have name and type parameters and 
    var request = {sensorType: body.sensorType, name: body.name};
    if(body.topBound) request.topBound = body.topBound;
    if(body.bottomBound) request.bottomBound = body.bottomBound;
    //check if rule already exists, make a new rule, add rule to device
    console.log('data into post', request);
    Rule.findOne({name: body.name}).exec()
    .then( function ( findOne ){
      console.log('findOne', findOne);
      if(!findOne) return Rule.create(request); 
      else throw new Error("Rule already in Database"); 
    }).then(function(createdRule){
      console.log('rule created');
      res.status(201).send("rule created");
    }).then(null, function(e){
      console.log('error', e);
      res.status(500).send(e);
    })
  }
  else {
    res.status(400).send("Need to include sensorType and name in rule post");
  }
});

router.put('/:myId/assign', function (req, res, next){
    //assign rule to a device
    var newRule = req.body.ruleName;
    var deviceName = req.body.deviceName;
    var ruleFromServer;
    console.log('begininning assigning process with', req.body);
    Rule.findOne({name: newRule}).exec()
    .then(function(rule){
      if(!rule) { 
        // console.log('rule is not defined');
        throw new Error("rule is not defined");
      }
      else {
        // console.log("rule", rule);
        ruleFromServer = rule;
        return Device.findOne({dis: deviceName}).exec();
      }
    }).then(function(device){
      if(!device) {
        console.log('device is not defined');
        throw new Error("device is not defined");
      }
      else {
        device.rule = ruleFromServer._id;
        console.log('Device', device, "rule", ruleFromServer._id);
        return device.save();
      }
    }).then(function(save){
      if(!save) throw new Error("error saving");
      else {
        console.log('save', save);
        ruleFromServer = null;
        res.status(201).send('Rule applied for', device.name);
      }
    }).then(null, function(e){
      console.log('ERROR', e);
      ruleFromServer = null;
      res.status(500).send(e);
    })
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
    sendAlertToServer();
  });
}

function sendAlertToServer (){ 
  console.log("ALERT!!!!!");
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
        // console.log('devices', devices);
        Promise.map( devices, function(box){
            var data = []; //assumes there is already something in DB
            box.data.forEach(function(point){
              // console.log('inside loop', point, timeOneMinuteAgo)
              // console.log('point.time', Date.parse(point.time),  "timeOneMinuteAgo", Date.parse(timeTenMinutesAgo), Date.parse(point.time) > Date.parse(timeTenMinutesAgo));
              if ( Date.parse(point.time) > Date.parse(timeTenMinutesAgo) ) data.push(point);
            });
            // console.log(data);
            return {dis: box.dis, data: data};

            // return myData;
        }).then(function(dataToUpload){
          // console.log('dataToUpload', dataToUpload);
          if(dataToUpload.length < 1) throw new Error('No devices to upload');
          else{
            console.log('data to upload', dataToUpload);
            dataToUpload.forEach(function(deviceData, index){
              // console.log('possible submission',deviceData.length);
              if(deviceData.data.length > 0){
                // console.log("device", deviceData , index, "is uploading new Data");
                sendToServer('POST', '/', deviceData);
              }
              else { 
                // console.log("device", deviceData.dis, "has no new data to upload"); 
              }
            });
          }
        }).catch(function(e){
          console.log('error:', e);
        });
      }
    }, 
    start: true,
    context: cache });


  function sendToServer (method, route, data){
  //method: PUT, POST, GET, DELETE
  //route: exact route to server
  //data: JSON formatted object (will need to be JSON.parse b/c its a string)
  //does it need to be promisified?
    console.log('data to be uploaded', data);
    // request.post(
    //   { method: 'POST',
    //     uri: 'http://ec2-52-6-65-109.compute-1.amazonaws.com' + route, 
    //     multipart: [{
    //       'content-type': 'application/json',
    //       body: JSON.stringify(data)
    //     }]
    //   }, 
    request.post('http://ec2-52-6-65-109.compute-1.amazonaws.com:1337/', data,
      function (error, response, body){
        console.log('err', error, 'response', response, 'body', body);
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

