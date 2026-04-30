const pool = require('./config/db');

pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Error:', err);
  else console.log('DB time:', res.rows[0]);
});