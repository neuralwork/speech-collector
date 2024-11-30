import { config } from 'dotenv';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const migrationFilePath = path.join(currentDir, 'migration.sql');

function createDbClient() {
    config(); // Load environment variables from .env file
    const { Client } = pkg;
    const password = encodeURIComponent(process.env.PG_PASSWORD); // Construct the connection string from environment variables
    const connString = `postgresql://${process.env.PG_USER}:${password}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`;
    const client = new Client({ connectionString: connString });    // Initialize PostgreSQL client
    return client;
}

// Function to create tables if not already present
async function createTables() {
    const client = createDbClient();
    try {
        // Connect to the database
        await client.connect();
        // Read the SQL migration file
        const sql = fs.readFileSync(migrationFilePath, 'utf-8');
        // Execute the migration
        await client.query(sql);
        console.log('Migration executed successfully.');
        return true; // Indicate success
    } catch (error) {
        console.error('Error executing migration:', error);
        return false; // Indicate failure
    } finally {
        // Close the database connection
        await client.end();
    }
}

async function pushSpokenSquad(filePath) {
    const client = createDbClient();
    try {
        // Connect to the database
        await client.connect();
        const jsonString = fs.readFileSync(filePath);
        const databaseJson = JSON.parse(jsonString).data;

        for (const item of databaseJson) {
            // Construct the topic document
            const topicName = item.title;
            const topicId = randomUUID();
            // Insert topic into the database if it doesn't already exist
            await client.query(`
                INSERT INTO topics (id, name, assigned, completed)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id) DO NOTHING
            `, [topicId, topicName, false, false]);

            let taskIdx = 0; // Initialize task index
            for (const paragraphData of item.paragraphs) {
                // First, the context task
                const taskId = randomUUID();
                await client.query(`
                    INSERT INTO tasks (id, topic_id, text, completed, task_idx)
                    VALUES ($1, $2, $3, $4, $5)
                `, [taskId, topicId, paragraphData.context, false, taskIdx]);
                taskIdx++;
                // Then, the question-answer pairs
                for (const { answers, question, id } of paragraphData.qas) {
                    // Insert question task
                    await client.query(`
                        INSERT INTO tasks (id, topic_id, text, completed, task_idx)
                        VALUES ($1, $2, $3, $4, $5)
                    `, [id + "_q", topicId, question, false, taskIdx]);
                    taskIdx++;
                    // Insert answer task
                    await client.query(`
                        INSERT INTO tasks (id, topic_id, text, completed, task_idx)
                        VALUES ($1, $2, $3, $4, $5)
                    `, [id + "_a", topicId, answers[0].text, false, taskIdx]);
                    taskIdx++;
                }
                await client.query(`
                    UPDATE topics
                    SET task_count=$2
                    WHERE id=$1
                `, [topicId, taskIdx]);
            }
            console.log(`Subject with ID '${topicId}' and its tasks have been added.`);
        }
        console.log('All topics and tasks have been pushed to PostgreSQL.');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Close the database connection
        await client.end();
    }
}

// Get the file path from the command line arguments
const filePath = process.argv[2];
if (!filePath) {
    console.error("Error: Please provide the path to the JSON file as an argument.");
    process.exit(1);
}

// Run the functions
const tablesCreated = await createTables();
if (tablesCreated) {
    await pushSpokenSquad(filePath);
} else {
    console.error("Migration failed. Database population skipped.");
}