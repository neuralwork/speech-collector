import pkg from 'pg';
const { Client } = pkg;

export class TaskProvider {
  constructor(connString, maxTopicsPerUser = null) {
    this.maxTopicsPerUser = maxTopicsPerUser;
    this.connString = connString;
  }
  
  async connect() {
    this.client = new Client({ connectionString: this.connString });
    await this.client.connect();
  }

  async close() {
    if (this.client) {
      await this.client.end();
    }
  }

  async getTask(username) {
    try {
      // Connect to the database
      await this.connect();
  
      // Check if the user exists and get the assigned topic and completed topics outside of a transaction
      const userQuery = await this.client.query(`
        SELECT assigned_topic, completed_topics FROM users WHERE username = $1
      `, [username]);
      
      if (userQuery.rowCount === 0) {
        return { success: false, message: "No such user in the database" };
      }
  
      let assignedTopicId = userQuery.rows[0].assigned_topic;
      let completedTopicCount = userQuery.rows[0].completed_topics.length;
  
      // Begin transaction only when a new topic needs to be assigned
      if (!assignedTopicId && completedTopicCount < this.maxTopicsPerUser) {
        await this.client.query('BEGIN');
  
        // Lock an available topic for assignment to prevent race conditions
        const topicQuery = await this.client.query(`
          SELECT id FROM topics
          WHERE assigned = false
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        `);
  
        if (topicQuery.rowCount > 0) {
          assignedTopicId = topicQuery.rows[0].id;
  
          // Update the user and mark the topic as assigned within the same transaction
          await this.client.query(`
            UPDATE users 
            SET assigned_topic = $1
            WHERE username = $2;
          `, [assignedTopicId, username]);
  
          await this.client.query(`
            UPDATE topics
            SET assigned = true
            WHERE id = $1;
          `, [assignedTopicId]);
  
          // Commit the transaction after updates
          await this.client.query('COMMIT');
        } else {
          // Rollback if no topics are available (or already locked)
          await this.client.query('ROLLBACK');
          return { success: false, message: "No available topics to assign." };
        }
      } else if (completedTopicCount >= this.maxTopicsPerUser) {
        return { success: false, message: `You completed the maximum number of topics assigned to you. Thank you ❤️` };
      }
  
      // Get the first incomplete task within the assigned topic outside of a transaction
      const taskQuery = await this.client.query(`
        SELECT * FROM tasks
        WHERE topic_id = $1 AND completed = false
        ORDER BY task_idx ASC
        LIMIT 1
      `, [assignedTopicId]);
  
      const task = taskQuery.rows[0];
      if (task) {
        return { success: true, task: task };
      } else {
        return { success: false, message: `No unassigned tasks available in topic ${assignedTopicId}, try again.` };
      }
    } catch (error) {
      // Handle errors and rollback if needed
      await this.client.query('ROLLBACK').catch(() => {});
      console.error("Error getting a task:", error);
      return { success: false, message: 'An internal server error occurred' };
    } finally {
      // Close the database connection
      await this.close();
    }
  }

  async submitTask(taskId) {
    try {
      // Connect to the database
      await this.connect();

      // Begin a read-only operation outside of a transaction to get task details
      const taskInfoQuery = await this.client.query(`
        WITH task_info AS (
          SELECT
            t.id AS topic_id,
            t.task_count,
            tk.task_idx
          FROM topics t
          JOIN tasks tk ON t.id = tk.topic_id
          WHERE tk.id = $1
        )
        SELECT topic_id, task_idx, task_count, 
              (task_idx >= task_count - 1) AS has_reached_task_count
        FROM task_info;
      `, [taskId]);

      if (taskInfoQuery.rowCount === 0) {
        return { success: false, message: "Task not found or invalid task ID." };
      }

      const taskInfo = taskInfoQuery.rows[0];
      const topicId = taskInfo.topic_id;
      const hasReachedTaskCount = taskInfo.has_reached_task_count;

      // Begin transaction for update operations
      await this.client.query('BEGIN');

      // Mark the task as completed
      await this.client.query(`
        UPDATE tasks
        SET completed = true
        WHERE id = $1;
      `, [taskId]);

      if (hasReachedTaskCount) {
        // Update the topic and users if all tasks are completed in the topic
        await this.client.query(`
          UPDATE topics
          SET completed = true
          WHERE id = $1;
        `, [topicId]);

        await this.client.query(`
          UPDATE users
          SET completed_topics = completed_topics || assigned_topic, assigned_topic = NULL
          WHERE assigned_topic = $1;
        `, [topicId]);
      }

      // Commit the transaction
      await this.client.query('COMMIT');
      return { success: true };
    } catch (error) {
      // Rollback the transaction in case of an error
      await this.client.query('ROLLBACK').catch(() => { });
      console.error("Error submitting the task:", error);
      return { success: false };
    } finally {
      // Close the database connection
      await this.close();
    }
  }
}