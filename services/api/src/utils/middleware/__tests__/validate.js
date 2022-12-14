const Joi = require('joi');
const { validateBody, validateQuery } = require('../validate');
const { context } = require('../../testing');

describe('validateBody', () => {
  it('should not throw an error if empty object passed', () => {
    const middleware = validateBody({});
    const ctx = context();
    expect(() => middleware(ctx, () => {})).not.toThrow('"value" must have at least 1 key');
  });

  it('should reject a request with invalid params', () => {
    // Require test param, but don't provide it in ctx object:
    const middleware = validateBody({
      test: Joi.number().required(),
    });
    const ctx = context();
    expect(() => middleware(ctx, () => {})).toThrow('"test" is required');
  });

  it('should accept a valid request', () => {
    const middleware = validateBody({
      test: Joi.string().required(),
    });
    const ctx = context({ url: '/' });
    ctx.request.body = { test: 'something' };

    middleware(ctx, () => {
      expect(ctx.request.body.test).toBe('something');
    });
  });

  it('should support the light syntax', () => {
    const middleware = validateBody({
      test: Joi.string().required(),
    });
    const ctx = context({ url: '/' });
    ctx.request.body = { test: 'something' };

    middleware(ctx, () => {
      expect(ctx.request.body.test).toBe('something');
    });
  });

  it('should strip unknown fields', () => {
    const middleware = validateBody({
      test: Joi.string().required(),
    });
    const ctx = context({ url: '/' });
    ctx.request.body = { test: 'something', foo: 'bar' };

    middleware(ctx, () => {
      expect(ctx.request.body.test).toBe('something');
      expect(ctx.request.body.foo).toBeUndefined();
    });
  });
});

describe('validateQuery', () => {
  it('should do type conversion for query', () => {
    const middleware = validateQuery({
      convertToNumber: Joi.number().required(),
    });
    const ctx = context({ url: '/' });
    ctx.request.query = {
      convertToNumber: '1234',
    };

    middleware(ctx, () => {
      expect(ctx.request.query.convertToNumber).toBe(1234);
    });
  });

  it('should strip attributes that are not defined', () => {
    const middleware = validateQuery({
      somethingExisting: Joi.string(),
    });

    const ctx = context({ url: '/' });
    ctx.request.query = {
      somethingExisting: 'yes',
      shouldBeRemoved: 'should be been removed from request',
    };

    middleware(ctx, () => {
      expect(ctx.request.query.somethingExisting).toBe('yes');
      expect(ctx.request.query.shouldBeRemoved).toBeUndefined();
    });
  });
});
