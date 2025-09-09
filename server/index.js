require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.send('ok');
  } catch (err) {
    res.status(500).send('db error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
