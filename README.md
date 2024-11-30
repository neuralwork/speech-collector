# SpeechCollector

SpeechCollector is an open-source full-stack web app for coordinated collection of paired text-speech datasets. It streamlines the process of collecting voice recordings from multiple users by automatically partitioning and allocating text samples, managing recording sessions, and organizing the resulting paired data. 

![SpeechCollector Demo](docs/assets/demo.gif)

SpeechCollector's tech stack and supported features are as follows:
- **Frontend**: React (Vite)
- **Backend**: Express.js
- **Database**: PostgreSQL
- **Storage Options**:
  - Local
  - AWS S3
  - Cloudflare R2
- **Authentication**: Basic user management where an admin sets plaintext passwords for new users.

## Installation & Configuration
After cloning the repository, install all dependencies using [pnpm](https://pnpm.io/installation) package manager:
```bash
cd speech-collector
pnpm i
```

### Required: Database Setup
SpeechCollector requires a PostgreSQL database to store application data including:
- User accounts and credentials
- Topics and tasks information
- Recording metadata and relationships
- User submission tracking

> 📘 **First time PostgreSQL user?**  
> See our [Database Setup Guide](docs/database-setup.md) for detailed installation and setup instructions.

1. **Configure Database Credentials**  
   Create or edit the `.env` file in your project root:
   ```env
   PG_HOST=localhost
   PG_PORT=5432
   PG_DATABASE=speechcollector
   PG_USER=yourusername
   PG_PASSWORD=yourpassword
   ```

2. **Initialize Database Tables**  
   For testing with the [Spoken-SQuAD](https://github.com/Chia-Hsuan-Lee/Spoken-SQuAD) dataset:
   ```bash
   node scripts/spoken-squad/push.js scripts/spoken-squad/spoken_train-v1.1.json
   ```

This script will create the necessary tables and populate it with spoken-squad dataset's train partition. To use other database structures, we provide a [Task Provider class](#database-structure-and-task-management-logic) you can edit. 

### Audio File Storage Options & Setup
SpeechCollector offers 3 options for storing the sound files: Local, AWS S3 and Cloudflare R2. Edit the `.env` file based on your storage choice as follows.

**Option 1 - Local Storage:**
Saves collected sound files to a user defined local folder.

- Set `STORAGE` environment variable to `local`
- Set `SOUND_RECORDINGS_PATH` environment variable to the desired local path

**Option 2 - AWS S3 Storage:**
Saves collected sound files to an AWS S3 bucket. This option requires an AWS account, configured AWS credentials and an initialized public or private [AWS S3](https://aws.amazon.com/s3/) bucket.

- Set `STORAGE` environment variable to `aws-s3`
- Set `AWS_ACCESS_KEY_ID`,`AWS_SECRET_ACCESS_KEY`,`AWS_REGION` and `AWS_BUCKET_NAME` environment variables.

**Option 3 - R2 Storage:**
Saves collected sound files to an Cloudflare R2 bucket. This option requires a Cloudflare account, configured AWS credentials and an initialized public or private [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket.

- Set `STORAGE` environment variable to `r2`
- Set `CF_R2_ACCESS_KEY_ID`,`CF_R2_SECRET_ACCESS_KEY`,`CF_R2_ENDPOINT`,`CF_R2_BUCKET_NAME` environment variables.


## Run SpeechCollector
Ensure your environment variables are set and the database is populated. Run the development server with:
```bash
pnpm dev
```
To build the project for production:
```bash
pnpm build
```
To run the build:
```bash
pnpm serve
```
Both `pnpm dev` and `pnpm serve` will instantiate the backend at port `8000` and run the frontend at port `5173`. You can access the app through `http://localhost:5173`.

## User Management & Onboarding Flow

### 1. Adding New Users
Before users can access the system, an admin must first create their account using one of these methods:

**Option A - Using PostgreSQL (Before Starting the App):**
```sql
INSERT INTO users (username, password) 
VALUES ('newuser', 'userpassword');
```

**Option B - Using API Endpoint (Once App is Running):**
```bash
curl -X POST http://localhost:8000/api/add-user \
-H "Content-Type: application/json" \
-d '{
  "username": "newuser",
  "password": "userpassword"
}'
```

### 2. User First Login & Metadata Collection
When a user first logs in with their assigned username and password, they will be presented with a metadata collection form requesting:
- Name
- Last name
- Email
- Gender
- Birth date
- Other configurable fields

The metadata form fields can be customized through the `infoFormConfig.json` file with required and optional fields.

### 3. Regular Usage
After completing the metadata form, users can:
- Access their assigned tasks
- Record audio for their tasks
- Submit recordings
- Continue until they reach their topic limit (if `MAX_TOPICS_PER_USER` is set) or until no tasks remain

## Database Structure and Task Management Logic
SpeechCollector uses a PostgreSQL database with tables for Users, Topics, and Tasks. The app includes a TaskProvider system that can be customized for different dataset structures.

> 📘 **Want to customize the database structure?**  
> See our [Database Structure Guide](docs/database-structure.md) for detailed information about the schema and how to adapt it for your needs.

## License
This project is licensed under the [MIT license](https://github.com/neuralwork/speech-collector/blob/main/LICENSE).


From [neuralwork](https://neuralwork.ai/) with :heart:
