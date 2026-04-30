const pool = require('./config/db');

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ DB Error:', err);
  } else {
    console.log('✅ DB time:', res.rows[0]);
  }
  process.exit();
});