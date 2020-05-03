const Router = require('koa-router');
const { createReadStream } = require('fs');
const { authenticate, fetchUser } = require('../middlewares/authenticate');
const { NotFoundError, UnauthorizedError } = require('../lib/errors');
const Upload = require('../models/upload');
const { storeUploadedFile } = require('../lib/uploads');

const router = new Router();

router
  .param('upload', async (id, ctx, next) => {
    const upload = await Upload.findById(id);
    ctx.state.upload = upload;
    if (!upload) {
      throw new NotFoundError();
    } else if (ctx.state.authUser.id != upload.ownerId) {
      throw new UnauthorizedError();
    }
    return next();
  })
  .get('/:hash', async (ctx) => {
    const upload = await Upload.findOne({ hash: ctx.params.hash });
    ctx.body = {
      data: upload.toResource()
    };
  })
  .get('/:hash/image', async (ctx) => {
    const { thumnail } = ctx.request.query;
    const upload = await Upload.findOne({ hash: ctx.params.hash });
    const url = thumnail && upload.thumbnailUrl ? upload.thumbnailUrl : upload.rawUrl;
    if (upload.storageType === 'local') {
      ctx.set('Content-Type', upload.mimeType);
      ctx.body = createReadStream(url);
    } else {
      ctx.redirect(url);
    }
  })
  .use(authenticate({ type: 'user' }))
  .use(fetchUser)
  .post('/', async (ctx) => {
    const { authUser } = ctx.state;
    const params = await storeUploadedFile(ctx.request.files.file);
    params.ownerId = authUser.id;
    const upload = await Upload.create(params);
    ctx.body = {
      data: upload.toResource()
    };
  })
  .delete('/:upload', async (ctx) => {
    const { upload } = ctx.state;
    await upload.delete();
    ctx.status = 204;
  });

module.exports = router;
