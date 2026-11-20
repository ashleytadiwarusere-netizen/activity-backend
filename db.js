// db.js - creates and exports the PostgreSQL connection pool
require("dotenv").config();
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString || "");

const pool = new Pool({
  connectionString,
  // Hosted databases (such as Render) need SSL; a database on this computer does not.
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

module.exports = pool;
