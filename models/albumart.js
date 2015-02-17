var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var albumartSchema = new Schema({
    path: {type: String, 'default': null, trim: true, required: false},
    artist: {type: String, 'default': 'Unknown', trim: true, required: true},
    album: {type: String, 'default': 'Unknown', trim: true, required: true}
});

albumartSchema.index({artist: 1, album: 1});

mongoose.model('albumart', albumartSchema);
