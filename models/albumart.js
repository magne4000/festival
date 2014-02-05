var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var albumartSchema = new Schema({
    path: {type: String, 'default': '', trim: true, required: true, unique: true},
    dir: {type: String, 'default': '', required: true, trim: true}
});

mongoose.model('albumart', albumartSchema);
