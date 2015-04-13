var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    uniqid = require('../lib/uniqid'),
    mime = require('mime');

var trackSchema = new Schema({
    path: {type: String, trim: true, required: true, unique: true},
    genre: {type: String, 'default': '', trim: true},
    artist: {type: String, 'default': '', trim: true},
    album: {type: String, 'default': '', trim: true},
    name: {type: String, trim: true, required: true},
    duration: {type: Number},
    year: {type: Number, min: 0, max: 9999},
    bitrate: {type: Number},
    frequency: {type: Number},
    trackno: {type: Number},
    mime: {type: String, trim: true, required: true},
    last_updated: {type: Date, 'default': Date.now}
});

trackSchema.virtual('uniqid').get(function () {
    return uniqid();
});

trackSchema.virtual('url').get(function () {
    return 'music/'+this._id;
});

trackSchema.set('toJSON', { virtuals: true });
trackSchema.set('toObject', { getters: true, virtuals: true });

trackSchema.options.toJSON.transform = function (doc, ret, options) {
    // remove the path
    delete ret.path;
};

trackSchema.pre('save', function (next) {
    this.mime = mime.lookup(this.path);
    next();
});

mongoose.model('track', trackSchema);
