# Database Structure and Task Management Guide

## Core Database Schema

The app's database schema is structured with three main tables:
- **Users**: Contains user information and credentials together with subject metadata.
- **Topics**: Represents topics that group related tasks.
- **Tasks**: Stores individual tasks associated with topics. Each user can be assigned to one or more topics, creating a structure similar to a QA dataset.

There are metadata fields in both users and tasks tables which has JSONB type where you can store metadata of users and tasks in json format.

## Dataset and Population Logic

### Sample Dataset
The app uses the **Spoken-SQuAD** dataset as the base database schema. Custom scripts have been developed to facilitate the creation and population of the database with this dataset.

### TaskProvider System
The `TaskProvider` class, located at `backend/src/taskProvider.js`, handles task management with two main methods:
- `getTask()`: Retrieves tasks for users to work on.
- `submitTask()`: Processes and stores task submissions.

## Customizing Database Structure

To adapt the app to different database structures:

1. Create your own `TaskProvider` implementation
2. Implement the required methods:
   - `getTask()`
   - `submitTask()`
3. Update your database schema accordingly

A default `TaskProvider` implementation for the [spoken-SQuAD](https://github.com/Chia-Hsuan-Lee/Spoken-SQuAD) dataset is included as an example.

## Return to Setup
Return to the [main README](../README.md) to continue with the SpeechCollector setup.