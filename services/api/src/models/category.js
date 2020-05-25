const mongoose = require('mongoose');
const Schema = require('../lib/Schema');

const schema = new Schema(
  {
    name: { type: String, trim: true, required: true }
  }
);

module.exports = mongoose.models.Category || mongoose.model('Category', schema);
