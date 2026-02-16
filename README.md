# **Enhanced Task Management System**

A simple Task Management Web Application built using React as the frontend and Injee as the backend REST API.
This application allows users to create, update, delete, search, and manage tasks with priority, completion status, and file attachments.

## Run Locally

Clone the project

```bash
 git clone https://github.com/17ramya/injee-task-manager
```

Go to the project directory
Backend Setup (Injee)

Install and start Injee:

```bash
  curl -L https://yu7.in/run-injee | sh
```
Check if it is running:

```bash
  curl http://localhost:4125/ops/health
```
**Frontend Setup (React)**

Open the terminal and run:

```bash
  cd frontend  
```

Start the react app

```bash
  npm install
  npm start
```
The application will open at: http://localhost:3000

The React app communicates with Injee using:

```js
const BASE_URL = "http://localhost:4125/api/tasks";
```
