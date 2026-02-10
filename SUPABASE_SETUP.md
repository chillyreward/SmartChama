# Supabase Database Setup for SmartChama

## Overview
This guide will help you set up the database table for storing admin user information in Supabase.

## Database Schema

The `chama_admins` table stores all admin user details with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `admin_user_id` | UUID | Foreign key to Supabase auth.users |
| `full_name` | TEXT | Admin's full name |
| `chama_name` | TEXT | Name of the chama |
| `chama_id` | TEXT | Unique identifier for the chama |
| `phone_number` | TEXT | Admin's phone number |
| `email` | TEXT | Admin's email address |
| `cycle_start_date` | DATE | Chama cycle start date |
| `cycle_end_date` | DATE | Chama cycle end date |
| `rules_text` | TEXT | Optional chama rules (nullable) |
| `created_at` | TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

## Setup Instructions

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Setup Script

1. Copy the entire contents of `supabase-setup.sql`
2. Paste it into the SQL Editor
3. Click **Run** or press `Ctrl+Enter`

### Step 3: Verify Table Creation

1. Go to **Table Editor** in the left sidebar
2. You should see the `chama_admins` table listed
3. Click on it to view the schema

### Step 4: Test the Setup

1. Try signing up a new admin user through your application
2. Check the `chama_admins` table in Supabase to verify the data was inserted
3. The `admin_user_id` should match the user's ID in the `auth.users` table

## Security Features

The setup includes:

- **Row Level Security (RLS)**: Enabled to protect user data
- **Policies**: Users can only view/edit their own data
- **Indexes**: Created on `admin_user_id` and `chama_id` for faster queries
- **Unique Constraint**: `chama_id` must be unique across all chamas
- **Foreign Key**: `admin_user_id` references `auth.users(id)` with CASCADE delete

## How It Works

### During Signup:

1. **Supabase Auth** creates a new user account with email/password
2. User receives a verification email
3. **Application** inserts admin details into `chama_admins` table
4. `admin_user_id` is set to the auth user's UUID

### During Login:

1. User authenticates with email/password
2. Application verifies `chama_id` matches the stored value
3. User is granted access to admin dashboard

## Troubleshooting

### Error: "relation 'chama_admins' does not exist"
- Run the SQL setup script in Supabase SQL Editor

### Error: "duplicate key value violates unique constraint"
- The `chama_id` already exists. Choose a different ID

### Error: "insert or update on table violates foreign key constraint"
- The `admin_user_id` doesn't exist in auth.users
- Ensure the auth user is created first

### Error: "new row violates row-level security policy"
- Check that RLS policies are correctly set up
- Verify the user is authenticated when inserting data

## Additional Notes

- The `rules_text` field is optional and can be left empty
- Timestamps are automatically managed by the database
- The `updated_at` field updates automatically on any row update
- All dates are stored in UTC timezone

## Support

If you encounter any issues, check:
1. Supabase project logs
2. Browser console for error messages
3. Network tab for API request/response details
