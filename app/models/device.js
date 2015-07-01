var mongoose = require('mongoose'),
  	Schema = mongoose.Schema;

var DeviceSchema = new Schema({
	dis: {type: String, required: true},
	givenID: String,
	location: [{lat: Number, lon: Number}],
	movable: Boolean,
	curStatus: String,
	rule: { type: Schema.Types.ObjectId, ref: 'Rule'},
	data: [{ val: Number, time: Date }]
});

mongoose.model('Device', DeviceSchema);