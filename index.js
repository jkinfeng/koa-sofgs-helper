'use strict';

const fs = require('fs');
const path = require('path');
const SQLite = require('better-sqlite3');

const DB_PATH = path.join(process.cwd(), 'database');

const DEFAULTS = {
    verbose: console.log
};

const DEFAULT_TTL = 15 * 60 * 1000;
const DEFAULT_INTERVAL = 15 * 60 * 1000;

const TABLE_NAME = '__session__';
const createTableSql = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (uuid TEXT PRIMARY KEY NOT NULL, expires INTEGER NOT NULL, data TEXT NOT NULL);`;
const selectSql = `SELECT * FROM ${TABLE_NAME} WHERE uuid = ?`;
const insertSql = `INSERT OR REPLACE INTO ${TABLE_NAME} (uuid, expires, data) VALUES (?, ?, ?)`;
const updateSql = `UPDATE ${TABLE_NAME} SET expires = ? WHERE uuid = ?`;
const deleteSql = `DELETE FROM ${TABLE_NAME} WHERE uuid = ?`;
const flushSql = `DELETE FROM ${TABLE_NAME} WHERE expires < ?`;

module.exports = class {
    constructor($options) {
        this.config = $options || {};
        this.dsn = this.config.dsn || path.join(DB_PATH, 'session.db3');
        this.dbPath = path.parse(this.dsn).dir;
        if (!fs.existsSync(this.dbPath)) fs.mkdirSync(this.dbPath);
        this.options = this.config.sqlite || DEFAULTS;
        this.ttl = this.config.ttl || DEFAULT_TTL;
        this.flushInterval = this.config.flushInterval || DEFAULT_INTERVAL;
        this.db = new SQLite(this.dsn, this.options);
        this.db.prepare(createTableSql).run();
        setInterval(this.flush.bind(this), this.flushInterval);
    }

    get($sid) {
        const __now = new Date().getTime();
        const __session = this.db.prepare(selectSql).get($sid);
        if (__session && __session.expires > __now) {
            this.update(__now + this.ttl, __session.uuid);
            return JSON.parse(__session.data);
        }
        this.destroy($sid);
        return false;
    }

    set($sid, $session, $ttl) {
        return this.db.prepare(insertSql).run(
            $sid,
            new Date().getTime() + $ttl,
            JSON.stringify($session)
        )
    }

    update($now, $sid) {
        return this.db.prepare(updateSql).run($now, $sid)
    }

    destroy($sid) {
        return this.db.prepare(deleteSql).run($sid);
    }

    flush() {
        return this.db.prepare(flushSql).run(new Date().getTime());
    }
};