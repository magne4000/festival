var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var trackSchema = new Schema({
    path: {type: String, 'default': '', trim: true, required: true, unique: true},
    genre: {type: String, 'default': '', trim: true},
    artist: {type: String, 'default': '', trim: true},
    album: {type: String, 'default': '', trim: true},
    name: {type: String, 'default': '', trim: true, required: true},
    duration: {type: Number},
    year: {type: Number, min: 0, max: 9999},
    bitrate: {type: Number},
    frequency: {type: Number},
    trackno: {type: Number},
    last_updated: {type: Date, 'default': Date.now}
});

mongoose.model('track', trackSchema);
