const { pool } = require('../db');

async function create({ party_id, user_id, message }) {
  const result = await pool.query(
    'INSERT INTO party_messages (party_id, user_id, message) VALUES ($1, $2, $3) RETURNING *',
    [party_id, user_id, message]
  );
  return result.rows[0];
}

module.exports = { create };
