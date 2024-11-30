# Database Setup Guide

This guide walks you through installing and setting up PostgreSQL for SpeechCollector.

## Installing PostgreSQL

### Windows
1. Download and install from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
2. PostgreSQL service starts automatically after installation

### Mac
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb speechcollector

# Connect to database
psql speechcollector
```

Once connected to the database, you can install extensions required to use the [Spoken-Squad](https://github.com/Chia-Hsuan-Lee/Spoken-SQuAD)schema, inspect the database content and exit.
```sql
CREATE EXTENSION "uuid-ossp";
\l
\q
```

### Ubuntu/Debian
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Enable auto-start on boot

# Switch to postgres user to create database
sudo -u postgres createdb speechcollector

# Connect to database (as postgres user)
sudo -u postgres psql speechcollector
```

Once connected to the database, you can inspect the database content and exit
```sql
CREATE EXTENSION "uuid-ossp";
\l
\q
```

## Next Steps
Return to the [main README](../README.md#required-database-setup) to continue with the SpeechCollector setup.