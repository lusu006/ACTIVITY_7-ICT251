const router = require("express").Router();
const { query } = require("../db");

const STATUSES = ["Pending", "In progress", "Completed"];
const COLUMNS = "id, title, category, description, status";
const MAX_ID = 2147483647;

// Returns a number, or null when the id is not a positive whole number.
function parseId(value) {
  return /^[1-9]\d{0,15}$/.test(value) ? Number(value) : null;
}

// Returns { error } or { value } for the four editable fields.
function validate(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object with title, category, description and status." };
  }
  for (const key of ["title", "category", "description", "status"]) {
    if (typeof body[key] !== "string") return { error: `${key[0].toUpperCase()}${key.slice(1)} is required and must be text.` };
  }
  const value = {
    title: body.title.trim(),
    category: body.category.trim(),
    description: body.description.trim(),
    status: body.status.trim()
  };
  if (value.title.length < 3 || value.title.length > 80) return { error: "Title must have 3 to 80 characters." };
  if (value.category.length < 2 || value.category.length > 40) return { error: "Category must have 2 to 40 characters." };
  if (value.description.length < 5 || value.description.length > 300) return { error: "Description must have 5 to 300 characters." };
  if (!STATUSES.includes(value.status)) return { error: "Status must be Pending, In progress or Completed." };
  return { value };
}

// Sends 400 for a bad id, 404 for a valid id that cannot exist; otherwise returns the id.
function checkId(req, res) {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ message: "Id must be a positive whole number." });
    return null;
  }
  if (id > MAX_ID) {
    res.status(404).json({ message: "Record not found." });
    return null;
  }
  return id;
}

router.get("/", async (req, res, next) => {
  try {
    const result = await query(`SELECT ${COLUMNS} FROM records ORDER BY id`);
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = checkId(req, res);
    if (id === null) return;
    const result = await query(`SELECT ${COLUMNS} FROM records WHERE id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Record not found." });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { error, value } = validate(req.body);
    if (error) return res.status(400).json({ message: error });
    // Any client-supplied id is ignored; the database generates it.
    const result = await query(
      "INSERT INTO records (title, category, description, status) VALUES ($1, $2, $3, $4) " +
        `RETURNING ${COLUMNS}`,
      [value.title, value.category, value.description, value.status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = checkId(req, res);
    if (id === null) return;
    const { error, value } = validate(req.body);
    if (error) return res.status(400).json({ message: error });
    const result = await query(
      "UPDATE records SET title = $1, category = $2, description = $3, status = $4 " +
        `WHERE id = $5 RETURNING ${COLUMNS}`,
      [value.title, value.category, value.description, value.status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Record not found." });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = checkId(req, res);
    if (id === null) return;
    const result = await query("DELETE FROM records WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Record not found." });
    res.status(200).json({ message: "Record deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
module.exports.validate = validate;
module.exports.parseId = parseId;
