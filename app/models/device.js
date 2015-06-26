var mongoose = require('mongoose'),
  	Schema = mongoose.Schema;

var DeviceSchema = new Schema({
	dis: {type: String, required: true},
	location: [],
	movable: false,
	curStatus: String,
	data: []
});

mongoose.model('Device', DeviceSchema);