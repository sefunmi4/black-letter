const { pool } = require('../db');

async function create({ title, description, user_id }) {
  const result = await pool.query(
    'INSERT INTO quests (title, description, user_id) VALUES ($1, $2, $3) RETURNING *',
    [title, description, user_id]
  );
  return result.rows[0];
}

async function list() {
  const result = await pool.query('SELECT * FROM quests ORDER BY id');
  return result.rows;
}

async function get(id) {
  const result = await pool.query('SELECT * FROM quests WHERE id = $1', [id]);
  return result.rows[0];
}

async function update(id, fields) {
  const { title, description, user_id } = fields;
  const result = await pool.query(
    'UPDATE quests SET title = COALESCE($1, title), description = COALESCE($2, description), user_id = COALESCE($3, user_id) WHERE id = $4 RETURNING *',
    [title, description, user_id, id]
  );
  return result.rows[0];
}

async function remove(id) {
  await pool.query('DELETE FROM quests WHERE id = $1', [id]);
}

module.exports = { create, list, get, update, remove };
