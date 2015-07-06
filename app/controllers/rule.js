var express = require('express'),
  router = express.Router(),
  request = require('request'),
  mongoose = require('mongoose'),
  Device = mongoose.model('Device'),
  Promise = require('bluebird'),
  Rule = mongoose.model('Rule');

 module.exports = function (app) {
  	app.use('/rule', router);
};
router.get('/', function(req,res,next){
	res.status(200).send('Successful Conncection');
})

router.get('/:myId/allrules', function (req, res, next){
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