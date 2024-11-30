import pkg from 'pg';
import * as fs from 'fs';
import { config } from 'dotenv';
import { writeToStream } from 'fast-csv';

function createDbClient() {
    config(); // Load environment variables from .env file
    const { Client } = pkg;
    const password = encodeURIComponent(process.env.PG_PASSWORD); // Construct the connection string from environment variables
    const connString = `postgresql://${process.env.PG_USER}:${password}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`;
    const client = new Client({ connectionString: connString });    // Initialize PostgreSQL client
    return client;
}

// Function to export table to CSV
async function exportTableToCSV(tableName) {
    const client = createDbClient();
    try {
        // Connect to PostgreSQL
        await client.connect();
        // Query data from the table
        const res = await client.query(`SELECT * FROM ${tableName}`);
        // Create a writable stream for the CSV file
        const writableStream = fs.createWriteStream(`${tableName}.csv`);
        // Use fast-csv's writeToStream to write the CSV
        writeToStream(writableStream, res.rows, { headers: true })
            .on('finish', () => {
                console.log('CSV file was written successfully.');
            });
    } catch (err) {
        console.error('Error exporting table:', err.stack);
    } finally {
        // Close the database connection
        await client.end();
    }
}

// Run the function
await exportTableToCSV('users');
await exportTableToCSV('topics');
await exportTableToCSV('tasks');