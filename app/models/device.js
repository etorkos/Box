var mongoose = require('mongoose'),
  	Schema = mongoose.Schema;

var DeviceSchema = new Schema({
	dis: {type: String, required: true},
	location: [],
	movable: Boolean,
	curStatus: String,
	data: []
});

mongoose.model('Device', DeviceSchema);