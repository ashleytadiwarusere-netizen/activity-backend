// routes/records.js - the five record routes
const router = require("express").Router();
const pool = require("../db");

const STATUSES = ["Pending", "In progress", "Completed"];
const COLUMNS = "id, title, category, description, status";
const MAX_DB_ID = 2147483647; // largest value a PostgreSQL integer id can hold

// Returns { id } for a positive whole number, otherwise { message }.
function checkId(raw) {
  if (!/^[1-9][0-9]*$/.test(String(raw))) {
    return { message: "Id must be a positive whole number." };
  }
  return { id: Number(raw) };
}

// Checks the four editable fields. Any client-supplied id is ignored.
function checkBody(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { message: "Request body must be a JSON object." };
  }
  const names = ["title", "category", "description", "status"];
  for (const name of names) {
    if (typeof body[name] !== "string") {
      return { message: name.charAt(0).toUpperCase() + name.slice(1) + " is required and must be text." };
    }
  }
  const value = {
    title: body.title.trim(),
    category: body.category.trim(),
    description: body.description.trim(),
    status: body.status.trim()
  };
  if (value.title.length < 3 || value.title.length > 80) {
    return { message: "Title must have 3 to 80 characters." };
  }
  if (value.category.length < 2 || value.category.length > 40) {
    return { message: "Category must have 2 to 40 characters." };
  }
  if (value.description.length < 5 || value.description.length > 300) {
    return { message: "Description must have 5 to 300 characters." };
  }
  if (!STATUSES.includes(value.status)) {
    return { message: "Status must be Pending, In progress or Completed." };
  }
  return { value };
}

function notFound(res) {
  return res.status(404).json({ message: "Record not found." });
}

// GET all
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT " + COLUMNS + " FROM records ORDER BY id");
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET one
router.get("/:id", async (req, res, next) => {
  try {
    const parsed = checkId(req.params.id);
    if (parsed.message) return res.status(400).json({ message: parsed.message });
    if (parsed.id > MAX_DB_ID) return notFound(res);

    const result = await pool.query("SELECT " + COLUMNS + " FROM records WHERE id = $1", [parsed.id]);
    if (result.rowCount === 0) return notFound(res);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST create
router.post("/", async (req, res, next) => {
  try {
    const checked = checkBody(req.body);
    if (checked.message) return res.status(400).json({ message: checked.message });
    const v = checked.value;

    const result = await pool.query(
      "INSERT INTO records (title, category, description, status) " +
      "VALUES ($1, $2, $3, $4) RETURNING " + COLUMNS,
      [v.title, v.category, v.description, v.status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// PUT update (replaces all four fields; never creates a missing record)
router.put("/:id", async (req, res, next) => {
  try {
    const parsed = checkId(req.params.id);
    if (parsed.message) return res.status(400).json({ message: parsed.message });
    const checked = checkBody(req.body);
    if (checked.message) return res.status(400).json({ message: checked.message });
    if (parsed.id > MAX_DB_ID) return notFound(res);
    const v = checked.value;

    const result = await pool.query(
      "UPDATE records SET title = $1, category = $2, description = $3, status = $4 " +
      "WHERE id = $5 RETURNING " + COLUMNS,
      [v.title, v.category, v.description, v.status, parsed.id]
    );
    if (result.rowCount === 0) return notFound(res);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE
router.delete("/:id", async (req, res, next) => {
  try {
    const parsed = checkId(req.params.id);
    if (parsed.message) return res.status(400).json({ message: parsed.message });
    if (parsed.id > MAX_DB_ID) return notFound(res);

    const result = await pool.query("DELETE FROM records WHERE id = $1 RETURNING id", [parsed.id]);
    if (result.rowCount === 0) return notFound(res);
    res.status(200).json({ message: "Record deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
