const test = require('ava');
const http = require('http');
const destroyable = require('server-destroy');
const Koa = require('koa');
const KoaRouter = require('koa-router');
const koaBody = require('koa-body');


const app = new Koa();

app.use(koaBody());

const router = new KoaRouter();

const methods = ['get', 'post', 'put', 'delete'];

methods.forEach((method) => {
    router[method](`/basic/${method}`, (ctx) => {
        ctx.body = `${method} response`;
    });
});

app.use(router.routes());

const server = http.createServer(app.callback());
destroyable(server);

server.getUrl = function (https) {
    return `http${https ? 's' : ''}://localhost:${this.address().port}/`;
};

test.before('start server', (t) => {
    server.listen(0, () => {
        t.pass();
    });
});

test.after('stop server', (t) => {
    server.destroy();
    t.pass();
});

app.use((ctx, next) => {
    console.log(ctx.request);
    next();
});

module.exports = server;
