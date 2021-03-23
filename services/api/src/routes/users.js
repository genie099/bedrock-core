const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const validate = require('../utils/middleware/validate');
const { authenticate, fetchUser } = require('../utils/middleware/authenticate');
const { requirePermissions } = require('../utils/middleware/permissions');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { searchValidation, exportValidation, getSearchQuery, search, searchExport } = require('../utils/search');
const { User } = require('../models');
const { expandRoles } = require('./../utils/permissions');
const roles = require('./../roles.json');
const permissions = require('./../permissions.json');

const router = new Router();

const passwordField = Joi.string()
  .min(6)
  .message('Your password must be at least 6 characters long. Please try another.');

router
  .use(authenticate({ type: 'user' }))
  .use(fetchUser)
  .param('userId', async (id, ctx, next) => {
    const user = await User.findById(id);
    ctx.state.user = user;
    if (!user) {
      throw new NotFoundError();
    }
    return next();
  })
  .get('/me', (ctx) => {
    const { authUser } = ctx.state;
    ctx.body = {
      data: expandRoles(authUser),
    };
  })
  .patch(
    '/me',
    validate({
      body: Joi.object({
        name: Joi.string(),
        timeZone: Joi.string(),
      }),
    }),
    async (ctx) => {
      const { authUser } = ctx.state;
      authUser.assign(ctx.request.body);
      await authUser.save();
      ctx.body = {
        data: expandRoles(authUser),
      };
    }
  )
  .use(requirePermissions({ endpoint: 'users', permission: 'read', scope: 'global' }))
  .get('/roles', (ctx) => {
    ctx.body = {
      data: roles,
    };
  })
  .get('/permissions', (ctx) => {
    ctx.body = {
      data: permissions,
    };
  })
  .post(
    '/search',
    validate({
      body: Joi.object({
        ...searchValidation(),
        ...exportValidation(),
        name: Joi.string(),
        role: Joi.string(),
      }),
    }),
    async (ctx) => {
      const { body } = ctx.request;
      const query = getSearchQuery(body, {
        keywordFields: ['name', 'email'],
      });

      const { role } = body;
      if (role) {
        query['roles.role'] = { $in: [role] };
      }
      const { data, meta } = await search(User, query, body);

      if (searchExport(ctx, data)) {
        return;
      }

      ctx.body = {
        data: data.map((item) => expandRoles(item)),
        meta,
      };
    }
  )
  .get('/:userId', async (ctx) => {
    ctx.body = {
      data: ctx.state.user,
    };
  })
  .use(requirePermissions({ endpoint: 'users', permission: 'write', scope: 'global' }))
  .post(
    '/',
    validate({
      body: Joi.object({
        email: Joi.string().lowercase().email().required(),
        name: Joi.string().required(),
        password: passwordField.required(),
        roles: Joi.array().items(
          Joi.object({
            role: Joi.string().required(),
            scope: Joi.string().required(),
          })
        ),
      }),
    }),
    async (ctx) => {
      const { email } = ctx.request.body;
      const existingUser = await User.findOne({ email, deletedAt: { $exists: false } });
      if (existingUser) {
        throw new BadRequestError('A user with that email already exists');
      }
      const user = await User.create(ctx.request.body);

      ctx.body = {
        data: user,
      };
    }
  )
  .patch(
    '/:userId',
    validate({
      body: Joi.object({
        id: Joi.string().strip(),
        email: Joi.string(),
        name: Joi.string(),
        roles: Joi.array().items(
          Joi.object({
            role: Joi.string().required(),
            scope: Joi.string().required(),
          })
        ),
        createdAt: Joi.date().strip(),
        updatedAt: Joi.date().strip(),
      }),
    }),
    async (ctx) => {
      const { user } = ctx.state;
      user.assign(ctx.request.body);
      await user.save();
      ctx.body = {
        data: user,
      };
    }
  )
  .delete('/:userId', async (ctx) => {
    const { user } = ctx.state;
    await user.delete();
    ctx.status = 204;
  });

module.exports = router;
