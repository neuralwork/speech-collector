-- Create the 'topics' table
CREATE TABLE IF NOT EXISTS topics (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    task_count INTEGER DEFAULT 0,
    assigned BOOLEAN DEFAULT false,
    completed BOOLEAN DEFAULT false
);

-- Create the 'tasks' table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(255) PRIMARY KEY,
    topic_id VARCHAR(255) REFERENCES topics(id),
    task_idx INTEGER NOT NULL,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    metadata JSONB
);

-- Create the 'users' table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    assigned_topic VARCHAR(255) REFERENCES topics(id),
    last_completed_task VARCHAR(255) REFERENCES tasks(id),
    completed_topics VARCHAR(255)[] DEFAULT '{}',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
