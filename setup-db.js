// setup-db.js - run with: npm run setup
// Creates the table, then inserts the starting records only if the table is empty.
const fs = require("fs");
const path = require("path");
const pool = require("./db");

async function main() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const seed = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8");

  await pool.query(schema);
  console.log("Table 'records' is ready.");

  const count = await pool.query("SELECT COUNT(*) AS total FROM records");
  if (Number(count.rows[0].total) === 0) {
    await pool.query(seed);
    console.log("Inserted the starting records.");
  } else {
    console.log("Records already exist. Seed skipped.");
  }
}

main()
  .catch((error) => {
    console.error("Setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
