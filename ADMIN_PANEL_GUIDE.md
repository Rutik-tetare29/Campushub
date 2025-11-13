# Admin Panel Documentation

## Overview
The Admin Panel provides comprehensive control over the entire Campus Connect system. Only users with the **admin** role can access this panel.

## Access Requirements
- **Role**: Admin only
- **Access URL**: `/admin`
- **Navigation**: 
  - Red "Admin Panel" button in the navigation bar (visible only to admins)
  - Quick action card on the Dashboard (for admin users)

## Features

### 1. Dashboard Statistics
Real-time overview cards displaying:
- **Total Users**: Count of all registered users
- **Subjects**: Total number of subjects
- **Schedules**: Total class schedules
- **Notices**: Total announcements
- **Uploads**: Total uploaded resources

### 2. User Management
Complete CRUD operations for user accounts:

#### View Users
- List all users with details:
  - Name
  - Email
  - Role (Student/Teacher/Admin) with color-coded badges
  - Account creation date
  - Credentials displayed in table

#### Create New User
- Click "Add User" button
- Fill in required fields:
  - Name
  - Email
  - Role (Student/Teacher/Admin dropdown)
  - Password (required for new users)
- System validates email uniqueness
- Password is automatically hashed

#### Edit User
- Click edit icon (✏️) on any user row
- Modify user details:
  - Update name, email, or role
  - Change password (optional - leave blank to keep current)
- Changes saved instantly to database

#### Delete User
- Click delete icon (🗑️) on any user row
- Confirmation dialog prevents accidental deletion
- **Safety**: Admin cannot delete their own account
- User removed from database immediately

### 3. Subjects Management

#### View Subjects
- List all subjects with:
  - Subject code
  - Subject name
  - Credit hours
  - Description
  - Teacher information

#### Create Subject
- Click "Add Subject" button
- Enter subject details:
  - Subject code (unique)
  - Subject name
  - Credits
  - Description

#### Edit Subject
- Click edit icon on subject row
- Update any subject information
- Changes reflect immediately

#### Delete Subject
- Admin-only permission
- Removes subject from system
- Confirmation required

### 4. Schedules Management

#### View Schedules
- Display all class schedules:
  - Day of week
  - Start and end time
  - Subject name
  - Room number
  - Semester

#### Delete Schedule
- Remove outdated or incorrect schedules
- Admin-only permission
- Confirmation dialog for safety

### 5. Notices Management

#### View Notices
- List all announcements:
  - Notice title
  - Content preview
  - Posted by (teacher/admin name)
  - Publication date

#### Delete Notice
- Remove outdated or incorrect notices
- Admin-only permission
- Confirmation required

### 6. Uploads Management

#### View Uploads
- List all uploaded resources:
  - Original filename
  - File size (formatted)
  - Uploader details (name and role)
  - Upload date and time

#### Delete Upload
- Removes file from both:
  - Database record
  - Physical file from server storage
- Admin-only permission
- Confirmation dialog

## Technical Details

### Backend Routes
All admin routes are protected with two middleware layers:
1. `auth` - Verifies JWT token
2. `permit('admin')` - Ensures user has admin role

#### Admin API Endpoints:
```
GET    /api/admin/stats          - Dashboard statistics
GET    /api/admin/users          - List all users
POST   /api/admin/users          - Create new user
PUT    /api/admin/users/:id      - Update user
DELETE /api/admin/users/:id      - Delete user
```

#### Delete Endpoints (Admin Only):
```
DELETE /api/subjects/:id          - Delete subject
DELETE /api/schedules/:id         - Delete schedule
DELETE /api/notices/:id           - Delete notice
DELETE /api/upload/:id            - Delete uploaded file
```

### Frontend Components
- **AdminPanel.jsx**: Main admin interface with tabbed sections
- **StatsOverview**: Real-time statistics cards
- **UsersManagement**: Complete user CRUD interface
- **SubjectsManagement**: Subject management with edit/delete
- **SchedulesManagement**: Schedule viewing and deletion
- **NoticesManagement**: Notice viewing and deletion
- **UploadsManagement**: File viewing and deletion

### Security Features
1. **Role-Based Access Control**:
   - Frontend: Admin panel only renders for admin users
   - Backend: All routes protected with `permit('admin')` middleware

2. **Self-Protection**:
   - Admins cannot delete their own accounts
   - Prevents accidental system lockout

3. **Confirmation Dialogs**:
   - All delete operations require confirmation
   - Prevents accidental data loss

4. **Password Security**:
   - User passwords are hashed with bcrypt (10 rounds)
   - Passwords never exposed in responses
   - Optional password updates (leave blank to keep current)

## User Credentials Display
The admin panel displays all user credentials in the User Management section:
- **Name**: Full name of the user
- **Email**: Login email address
- **Role**: Permission level (Student/Teacher/Admin)
- **Created At**: Account creation date

Note: Passwords are encrypted and cannot be viewed. Admin can only reset passwords by editing the user and entering a new password.

## Demo Admin Account
```
Email: admin@campus.edu
Password: admin123
```

## Usage Instructions

### Logging in as Admin
1. Go to the homepage
2. Click "Login"
3. Use admin credentials
4. Access Admin Panel from navigation bar or dashboard

### Managing Users
1. Navigate to Admin Panel
2. Users tab is selected by default
3. View all user credentials in the table
4. Use action buttons to:
   - Edit user details (click pencil icon)
   - Delete users (click trash icon)
   - Add new users (click "Add User" button)

### Managing Other Resources
1. Click on respective tabs (Subjects/Schedules/Notices/Uploads)
2. View all records in organized tables
3. Use delete buttons to remove records
4. System shows confirmation before deletion

## Best Practices
1. **Backup Before Deletion**: Ensure you have backups before deleting critical data
2. **User Management**: Regularly audit user accounts and remove inactive ones
3. **File Management**: Periodically clean up old uploaded files
4. **Notice Management**: Archive or delete outdated announcements
5. **Schedule Updates**: Keep schedules current by removing old semester data

## Troubleshooting

### Cannot Access Admin Panel
- Verify your account has admin role
- Check browser console for errors
- Ensure you're logged in

### Delete Operations Failing
- Check network connection
- Verify admin permissions
- Review backend logs for errors

### Stats Not Updating
- Refresh the page
- Check if backend is running
- Verify database connection

## Future Enhancements
Potential features for future versions:
- Bulk user operations (import/export CSV)
- Advanced filtering and search
- Audit logs for all admin actions
- Role permission customization
- Data export functionality
- Analytics and reporting dashboard
