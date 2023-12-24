const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const path = require('path');

const app = express();

const port = 3000;
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'asel3127',
  port: 5433,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Received signup data:', { username, email, hashedPassword });

    const query =
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [username, email, hashedPassword, 'regular'];

    const result = await pool.query(query, values);


    console.log('Signup result:', result.rows[0]);

    res.json({ message: 'Registered successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).send('Error registering user');
  }
});

app.post('/api/auth/signin', async (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = $1';
  const values = [username];

  try {
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).send('User not found');
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      const role = user.role;
      if (role === 'regular') {
        res.redirect('/user.html');
      } else if (role === 'admin') {
        res.redirect('/admin.html');
      } else if (role === 'moderator') {
        res.redirect('/moderator.html');
      }
    } else {
      return res.status(401).send('Invalid password');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error login user');
  }
});

app.post('/api/auth/logout', (req, res) => {
  const redirectTo = req.get('referer') || '/';
  res.redirect(redirectTo);
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/user.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'user.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/moderator.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'moderator.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
