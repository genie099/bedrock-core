const Schema = require('../Schema');
const mongoose = require('mongoose');
const { setupDb, teardownDb } = require('../../test-helpers');

beforeAll(async () => {
  await setupDb();
});

afterAll(async () => {
  await teardownDb();
});


let counter = 0;

function createModel(schema) {
  return mongoose.model(`SchemaTestModel${counter++}`, schema);
}

describe('Schema', () => {

  describe('basic functionality', () => {

    it('should be able to create basic schema', async () => {
      const User = createModel(new Schema({
        name: { type: String, validate: /[a-z]/ }
      }));
      const user = new User({ name: 'foo' });

      expect(user.name).toBe('foo');

      await expect(async () => {
        user.name = 'FOO';
        await user.save();
      }).rejects.toThrow();

    });
  });

  describe('defaults', () => {

    it('should add timestamps by default', async () => {
      const User = createModel(new Schema());
      const user = new User();
      await user.save();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should add deletedAt by default', async () => {
      const User = createModel(new Schema());
      const user = new User();
      await user.save();
      await user.delete();
      expect(user.deletedAt).toBeInstanceOf(Date);
    });

  });

  describe('serialization', () => {

    it('should expose id', () => {
      const User = createModel(new Schema());
      const user = new User();
      const data = JSON.parse(JSON.stringify(user));
      expect(data.id).toBe(user.id);
    });

    it('should not expose _id or __v', () => {
      const User = createModel(new Schema());
      const user = new User();
      const data = JSON.parse(JSON.stringify(user));
      expect(data._id).toBeUndefined();
      expect(data.__v).toBeUndefined();
    });

    it('should not expose fields with underscore or marked private', () => {
      const User = createModel(new Schema({
        _private: String,
        password: { type: String, access: 'private' },
      }));
      const user = new User();
      user._private = 'private';
      user.password = 'fake password';

      expect(user._private).toBe('private');
      expect(user.password).toBe('fake password');

      const data = JSON.parse(JSON.stringify(user));

      expect(data._private).toBeUndefined();
      expect(data.password).toBeUndefined();
    });

  });

  describe('autopopulate', () => {

    it('should not expose private fields when using with autopopulate', async () => {
      const User = createModel(new Schema({
        password: { type: String, access: 'private' },
      }));

      const shopSchema = new Schema({
        user: {
          ref: User.modelName,
          type: mongoose.Schema.Types.ObjectId,
          autopopulate: true,
        }
      });

      shopSchema.plugin(require('mongoose-autopopulate'));
      const Shop = createModel(shopSchema);

      const user = new User();
      user.password = 'fake password';
      await user.save();

      let shop = new Shop();
      shop.user = user;
      await shop.save();

      shop = await Shop.findById(shop.id);

      const data = JSON.parse(JSON.stringify(shop));

      expect(data.user.id).toBe(user.id);
      expect(data.user._id).toBeUndefined();
      expect(data.user.__v).toBeUndefined();
      expect(data.user.password).toBeUndefined();
    });

  });
});
