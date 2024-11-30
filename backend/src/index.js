import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pkg from 'pg';

import { TaskProvider } from './taskProvider.js';
import { FileStorage } from './fileStorage.js';

const { Client } = pkg;
const password = encodeURIComponent(process.env.PG_PASSWORD);
const connString = `postgresql://${process.env.PG_USER}:${password}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`;
console.log(connString)
const provider = new TaskProvider(connString, process.env.MAX_TOPICS_PER_USER);
const fileStorage = new FileStorage(process.env.STORAGE);

// Express app setup
const app = express();
app.use(cors({ origin: process.env.APP_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const upload = multer();


// Routes
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  let client;
  try {
    client = new Client({ connectionString: connString });
    await client.connect();
    const loginQuery = await client.query(`
      SELECT *
      FROM users
      WHERE username='${username}' AND password='${password}'
      LIMIT 1
    `);
    if (loginQuery.rowCount > 0) {
      res.json({ result: 'success', metadata: loginQuery.rows[0].metadata });
    } else {
      res.json({ result: 'incorrect credentials' });
    }
  } catch (error) {
    console.log(error)
    res.json({ result: 'error', error: error instanceof Error ? error.message : String(error) });
  } finally {
    await client.end();
  }
});

app.post('/api/get-task', async (req, res) => {
  const { username } = req.body;
  try {
    const result = await provider.getTask(username);
    // If not successful, send the failure message and a relevant status code
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in /get-task endpoint:", error);
    res.status(500).json({ success: false, message: 'An internal server error occurred' });
  }
});

app.post('/api/upload-sound', upload.single('file'), async (req, res) => {
  const { username, taskId } = req.body;
  const file = req.file;
  try {
    await fileStorage.saveRecording(file, taskId + '.wav');
    const { success } = await provider.submitTask(taskId);
    res.json({
      success: success
    });
  } catch (error) {
    console.log(error.message)
    res.json({
      success: false,
      error: "Internal server error."
    });
  }
});

app.post('/api/add-user', async (req, res) => {
  const { Client } = pkg;
  const client = new Client({
    connectionString: connString,
  });

  try {
    await client.connect();

    // Extract user data from the request body
    const { username, password } = req.body;

    // Basic validation (add more as needed)
    if (!username) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert user into the database
    await client.query(`
      INSERT INTO users (username, password)
      VALUES ($1, $2)
    `, [username, password]);

    res.status(201).json({ message: 'User added successfully' });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'An error occurred while adding the user' });
  } finally {
    await client.end();
  }
});

app.post('/api/update-user-metadata', async (req, res) => {
  const { Client } = pkg;
  const client = new Client({
    connectionString: connString,
  });
  const { username, metadata } = req.body;
  try {
    await client.connect();
    if (!username) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    await client.query(`
      UPDATE users
      SET metadata=$1
      WHERE username=$2
    `, [metadata, username]);

    res.status(201).json({ message: 'User metadata updated successfully' });
  } catch (error) {
    const errMessage = `Error updating user ${username}` + error;
    console.log(errMessage);
    res.status(500).json({ error: errMessage });
  } finally {
    await client.end();
  }
});

app.get('/ping', (req, res) => {
  res.json({ ready: true });
});

app.listen(8000, () => {
  console.log('Server is running on port 8000');
});
