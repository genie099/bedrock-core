const Router = require('koa-router');
const Koa = require('koa');
const cors = require('@koa/cors');
const logger = require('koa-logger');
const bodyParser = require('koa-body');
const errorHandler = require('./middlewares/error-handler');
const Sentry = require('@sentry/node');
const fs = require('fs');
const { version } = require('../package.json');
const v1 = require('./v1');
const config = require('@kaareal/config');
const { merge } = require('lodash');

const app = new Koa();

const NODE_ENV = process.env.NODE_ENV;

app
  .use(errorHandler)
  .use(NODE_ENV === 'test' ? (_, next) => next() : logger())
  .use(
    cors({
      exposeHeaders: ['content-length'],
      maxAge: 600
    })
  )
  .use(bodyParser({ multipart: true }));

app.on('error', (err) => {
  // dont output stacktraces of errors that is throw with status as they are known
  if (!err.status || err.status === 500) {
    console.error(err.stack);
  }
});

if (config.has('SENTRY_DNS')) {
  Sentry.init({
    dsn: config.get('SENTRY_DNS')
  });
}

const router = new Router();
app.router = router;
router.get('/', (ctx) => {
  ctx.body = {
    version,
    openapiPath: '/openapi.json'
  };
});

const mergeOpenAPIJSON = merge(
  JSON.parse(fs.readFileSync(`${__dirname}/../openapi/generated.json`).toString()),
  JSON.parse(fs.readFileSync(`${__dirname}/../openapi/user-defined.json`).toString())
);

router.get('/openapi.json', (ctx) => {
  ctx.body = mergeOpenAPIJSON;
});

router.use('/1', v1.routes());

app.use(router.routes());
app.use(router.allowedMethods());

module.exports = app;
