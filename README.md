# To-Du API

## Project Overview

To-Du is a backend task management system built with Node.js and Express. It provides a RESTful API that allows users to register, authenticate, and manage tasks securely.

---

## Features

### Authentication & Authorization
- User registration with secure password hashing (Argon2)
- User login with JWT-based authentication
- JWT stored in HTTP-only cookies
- Protected routes using authentication middleware
- Logout support

### User Management
- Fetch authenticated user profile (`/me`)
- Edit user details (planned)

### Task Management
- Create tasks with:
  - Title
  - Description (body)
  - Priority (low, medium, high, utmost)
- Fetch all tasks with optional filtering:
  - By status
  - By priority
  - By search query
- Fetch single task by ID
- Delete task
- Update task (planned)
- Change task status (planned)

### Priority-Based Reminder System
- Priority determines reminders per day:
  - Low → 1 reminder/day
  - Medium → 3 reminders/day
  - High → 6 reminders/day
  - Utmost → 12 reminders/day
- Automatic reminder scheduling using cron
- `nextReminderAt` timestamp for controlled email frequency
- Reminder intervals calculated as: `24 / remindersPerDay`

### Email Notifications
- Email delivery powered by Nodemailer
- Mailtrap integration for development testing
- HTML-formatted task reminder emails
- Manual reminder trigger via controller endpoint

### Validation & Error Handling
- Centralized error handling using custom `HttpError`
- Standardized success responses via `HttpMessage`
- Field validation for required inputs
- Priority validation against predefined constants

### Persistence
- JSON file-based storage for:
  - Users
  - Tasks
- Read/write helpers for data consistency

### Background Processing
- Cron-based background reminder job
- Automatic task scanning for due reminders
- Safe error handling within scheduled jobs

---

## Project Structure
```

.
├── ./README.md                                             (Documentation)
├── ./TODO.md                                               (Project TODOs)
├── ./controllers
│   ├── ./controllers/taskController.js                     (Logic Controller for Tasks Endpoints)
│   └── ./controllers/userController.js                     (Logic Controller for User Endpoints)
├── ./db
│   ├── ./db/tasks.json                                     (Task Data)
│   └── ./db/users.json                                     (User Data)
├── ./middleware
│   ├── ./middleware/asyncHandler.js                        (Async Error Handler)
│   ├── ./middleware/authMiddleware.js                      (Auth Middleware — Handles JWT Authentication)
│   └── ./middleware/errorMiddleware.js                     (Error Middleware — Handles Errors)
├── ./models
│   ├── ./models/errorModel.js                              (Error Model)
│   └── ./models/sucessModel.js                             (Success Model)
├── ./package-lock.json                                     (Package Lock File)
├── ./package.json                                          (Package File)
├── ./routes
│   ├── ./routes/taskRoutes.js                              (Endpoints for Tasks)
│   └── ./routes/userRoutes.js                              (Endpoints for Users)
├── ./server
├── ./server.js                                             (Main Server File — Initializes Server)
└── ./utils
    ├── ./utils/constants.js                                (Constants — Constant values in application)
    ├── ./utils/cronJobs.js                                 (Cron Jobs — Hanldes Reminders)
    ├── ./utils/fileHelper.js                               (Helps Write and Read User and Tasks Data)
    ├── ./utils/mailer.js                                   (Sends Emails)
    ├── ./utils/reminderHelper.js                           (Helps Send Reminders)
    ├── ./utils/sendCookie.js                               (Sends Cookies)
    ├── ./utils/sendEmail.js                                (Sends Emails)
    └── ./utils/token.js                                    (Generates JWT Tokens)

```

---

## Setup

### Clone the Repo
```sh
    git clone https://github.com/Omoju-Mayowa/To-Du
```

### Install Dependencies
```sh
    npm install
```

### Start the Server
```sh
    npm start
``` 

You're good to go!

---
## Usage