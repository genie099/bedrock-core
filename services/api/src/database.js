const config = require('@kaareal/config');
const mongoose = require('mongoose');

mongoose.Promise = Promise;

module.exports = async () => {
  await mongoose.connect(config.get('MONGO_URI'), {
    useFindAndModify: false,
    useNewUrlParser: true,
    useCreateIndex: true
  });
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', () => {
    console.info('mongodb connected');
  });
  return db;
};
