# koa-sofgs-helper
> sqlite3 session of koa-generic-session<br>
koa-sofgs-helper works with koa-generic-session (a generic session middleware for koa).

## Example
```javascript
const koa = require('koa');
const session = require('koa-generic-session');
const SessionStore = require('koa-sofgs-helper');

const server = new koa();

server.keys = ['cms'];  // must

server.use(
    session({
        key: 'cms',  // must
        prefix: 'cms:',  // defaults: koa:sess:
        cookie:{
            httpOnly: true,
            path: '/',
            overwrite: true,
            signed: true,
            maxAge: 15 * 60 * 1000,  // browser cookie expires
        },
        store: new SessionStore({
            dsn: $.path.join(process.cwd(), 'database', 'mysession.db3'), // default: process.cwd/database/session.db3
            ttl: 15 * 60 * 1000,  // sqlite session expires, default 15 min
            flushInterval: 15 * 60 * 1000  // session flush cycle , default 15 min
        })
    })
);
```