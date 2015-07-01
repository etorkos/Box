var mongoose = require('mongoose'),
  	Schema = mongoose.Schema;

  	var RuleSchema = new Schema ({
  		sensorType: {type: String, required: true},
  		name: {type: String, required: true},
  		topBound: Number,
  		bottomBound: Number,
  		neededRate: Number,
  	});

  	mongoose.model('Rule', RuleSchema);