# StaffStream EMS — Enterprise Employee Management System

> Production-ready, full-stack Enterprise Human Resource & Employee Management System (EMS) designed for single-organization workforce operations. Built with **Laravel 13 RESTful API**, **PostgreSQL Database**, and a **React 19 + TypeScript** Single Page Application faithfully replicating the **Apex Shadcn Dashboard UI** design language with **Tailwind CSS**, dynamic color presets, command search (`⌘K`), and bilingual **Khmer (ភាសាខ្មែរ) & English** support.

---

## 1. Executive Summary & Architecture Overview

StaffStream EMS is engineered as a robust **Modular Monolith + RESTful API** system. It models the operational reality of enterprise organizations: hierarchical departments, positions, dynamic supervisor structures, assignment histories, punctuality & attendance tracking, multi-tier leave approval workflows, multi-currency payroll, candidate recruitment pipelines, and role-based access control.

```
                           ┌──────────────────────────────────────────┐
                           │   React 19 + TypeScript (Vite + Tailwind)│
                           │   • shadcn/ui & Radix UI                 │
                           │   • Bilingual (Khmer ភាសាខ្មែរ & English) │
                           │   • Dark / Light Theme & Responsive UI   │
                           └────────────────────┬─────────────────────┘
                                                │ REST API (Bearer Sanctum)
                                                ▼
                           ┌──────────────────────────────────────────┐
                           │   Laravel 13 RESTful API Backend         │
                           │   • 37 Eloquent Models & Migrations      │
                           │   • 10 API Controllers (94 endpoints)   │
                           │   • Spatie Permission RBAC & Audit Trail │
                           └────────────────────┬─────────────────────┘
                                                │
                      ┌─────────────────────────┴─────────────────────────┐
                      ▼                                                   ▼
         ┌─────────────────────────┐                         ┌─────────────────────────┐
         │ PostgreSQL 16 / SQLite  │                         │      Redis 7 / Cache    │
         │ Relational Source-of-   │                         │  Session, Queue & Fast  │
         │ Truth & Historic Logs   │                         │  Real-Time Metrics      │
         └─────────────────────────┘                         └─────────────────────────┘
```

---

## 2. Core Architectural Principles

### 1. Employee Assignment as the Single Source of Truth
Organizational departments, positions, and reporting lines are **never** hardcoded into the base employee profile. Instead, every placement exists as an auditable record in `employee_assignments`:
- **Current Active Placement**: An assignment where `is_primary = true` and `status = 'active'`.
- **Department Transfers & Promotions**: Adding a new approved primary assignment automatically closes the previous primary assignment on the day prior to the effective date (`end_date = start_date - 1 day`).
- **Complete Historical Audit**: Full career progression, transfers, position changes, and supervisor transitions are preserved permanently.

### 2. Punctuality & Attendance Engine
Attendance records are contextualized by the employee's active assignment and work shift:
- **Automated Late Calculation**: Grace period evaluation against shift `start_time` computes exact `late_minutes`.
- **Overtime Calculation**: Clock-outs past shift `end_time` (adjusted for required break duration) generate overtime minutes.
- **Audit-Controlled Adjustments**: Manual admin adjustments and employee correction requests require review notes and store previous values.

### 3. Multi-Tier Leave Request Workflow
Leave requests undergo a strict enterprise approval cycle:
- `Employee Submission` ➔ `Tier 1: Supervisor Review` ➔ `Tier 2: HR Manager Final Approval`.
- Leave balances are automatically deducted upon final HR approval.
- Overlapping requests and insufficient balances are strictly blocked at validation.

### 4. Multi-Currency Payroll Processing (USD & KHR)
- Supports monthly batch generation for all active employees.
- Calculates gross salary, fixed allowances, taxable income, employee tax withholding, and net salary.
- Provides interactive, printable enterprise payslips.

### 5. Role-Based Access Control (RBAC)
Powered by `spatie/laravel-permission` with 6 dedicated roles and 25 granular permissions:
1. **Super Admin**: Unrestricted system administration, settings, user management, and audit logs.
2. **HR Manager**: Full employee lifecycle, assignments, leave approvals, recruitment, and payroll review.
3. **HR Staff**: Day-to-day employee operations, attendance logging, and recruitment tracking.
4. **Department Manager**: Team supervision, supervisor-level leave approvals, and performance reviews.
5. **Accountant**: Salary structure configuration, payroll processing, batch approvals, and payslips.
6. **Employee**: Self-service portal (dashboard, check-in/out, leave requests, own documents, and payslips).

---

## 3. Technology Stack

### Frontend Application (Apex Shadcn Architecture)
- **Design System**: Apex Shadcn Dashboard visual hierarchy, dark collapsible rail (`w-[260px]` / `w-[68px]`), sticky blur header, 6 color presets (`emerald`, `blue`, `violet`, `rose`, `orange`, `slate`)
- **Search & Commands**: Command Palette (`cmdk`) triggered via `⌘K` or click
- **Runtime & Build**: React 19, TypeScript 5, Vite 6
- **Styling**: Tailwind CSS 3.4, PostCSS, Lucide React
- **Component Primitives**: Radix UI, shadcn/ui design patterns
- **Data Fetching & State**: TanStack Query (React Query 5), Axios, Zustand (Auth, Locale, Theme)
- **Data Visualizations**: Recharts (Area, Bar, Pie/Donut charts with 7D/30D/90D range toggles)
- **Internationalization**: Centralized Khmer (`km` — default) & English (`en`) dictionary
- **Typography**: Kantumruy Pro (Khmer) & Inter (English)

### Backend API
- **Framework**: Laravel 13 running on PHP 8.3+
- **Authentication**: Laravel Sanctum (Stateful & API Bearer Tokens)
- **Authorization**: Spatie Laravel Permission (Roles & Permissions RBAC)
- **Audit Trails**: Spatie Activitylog
- **Data Layer**: PostgreSQL 16 (Production / Docker) & SQLite (Zero-Config Development)
- **Storage**: Laravel Storage with secure MIME-type validation

---

## 4. Pre-Seeded Test Credentials Matrix

All test accounts share the default password: **`1234567`**

| Role | Email | Password | Primary Access & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@gmail.com` | `1234567` | Full access across all 14 modules, RBAC, settings, audit logs |
| **HR Manager** | `hrmanager@gmail.com` | `1234567` | Employee lifecycle, Tier 2 leave approval, transfers, recruitment |
| **HR Staff** | `hrstaff@gmail.com` | `1234567` | Directory entries, daily attendance logs, candidate tracking |
| **Department Manager** | `deptmanager@gmail.com` | `1234567` | Org hierarchy, Tier 1 leave reviews, team performance ratings |
| **Accountant** | `accountant@gmail.com` | `1234567` | Salary structures, monthly payroll processing, payslip audits |
| **Employee** | `employee@gmail.com` | `1234567` | Self-service check-in/out, personal leave requests, payslips |
| **Employee (Khmer Profile)** | `sovann@gmail.com` | `1234567` | Self-service portal with dual English/Khmer name records |

> **Quick Switcher**: The Frontend login screen includes one-click role switcher buttons to test each role instantly without manually typing credentials.

---

## 5. Local Setup & Installation

### Prerequisites
- **PHP**: 8.3+ with `pdo_sqlite`, `pdo_pgsql`, `intl`, `mbstring` extensions
- **Composer**: 2.7+
- **Node.js**: 20+ or 22+
- **NPM**: 10+

### Quick Start (Makefile Shortcuts 🚀)

You can manage and run both the **Laravel 13 API Backend** and the **React 19 Frontend** using `make`:

```bash
# View all available shortcut commands
make help

# Run both Backend API (port 8005) & Webclient (port 5175) concurrently
make dev

# Run only Laravel Backend API (port 8005)
make dev-api       # or: make api, make dev-backend, make backend

# Run only Vite Webclient (port 5175)
make dev-web       # or: make web, make dev-webclient, make webclient

# Custom ports override (optional)
make dev BACKEND_PORT=8002 WEB_PORT=5172

# Setup dependencies, .env files, key & migrations
make setup

# Run Backend tests & Webclient build check
make test

# Build Webclient for production
make build

# Docker management
make docker-up
make docker-down
make docker-logs
```
* **Frontend App**: `http://localhost:5175`
* **Backend API**: `http://127.0.0.1:8005`
* Press `Ctrl+C` to cleanly stop both servers.

---

### Option A: Standard Local Development (PostgreSQL)

#### 1. Backend Setup
```bash
cd backend

# Install PHP dependencies
composer install

# Configure environment (.env is set to PostgreSQL staffstream_ems)
cp .env.example .env
php artisan key:generate

# Run migrations and seed complete sample data
php artisan migrate:fresh --seed

# Start Laravel development server on port 8005
php artisan serve --port=8005
```
Backend API will be live at `http://127.0.0.1:8005`.

*Note: If you prefer SQLite, simply toggle `DB_CONNECTION=sqlite` in `backend/.env`.*

#### 2. Frontend Setup
```bash
cd webclient

# Install Node dependencies
npm install

# Configure environment
cp .env.example .env

# Start Vite dev server on port 5175
npm run dev
```
Frontend Web Application will be live at `http://127.0.0.1:5175`.
*Note: Vite is pre-configured with reverse-proxying for `/api` and `/storage` pointing directly to `http://127.0.0.1:8005`.*

---

### Option B: Docker Production Deployment

To run the complete production stack (Nginx, React Frontend, PHP-FPM Backend, PostgreSQL 16, and Redis 7):

```bash
# Build and start all services in detached mode
docker compose up -d --build

# Run database migrations and seeders inside backend container
docker compose exec backend php artisan migrate --seed

# View container status
docker compose ps
```

The system will be accessible at:
- **Web App & Reverse Proxy**: `http://localhost:80`
- **PostgreSQL**: `localhost:5432` (`postgres` / `secret`)
- **Redis**: `localhost:6379`

---

## 6. System Modules & Features

```
StaffStream EMS Modules
├── 01. Dashboard
│   ├── Real-time KPIs (Total Employees, Active, Today's Attendance, Pending Leaves, Monthly Payroll)
│   ├── Interactive Attendance Check-in / Check-out Widget
│   ├── Attendance Trends Area Chart & Department Headcount Bar Chart
│   └── Gender Ratio Donut Chart, Upcoming Birthdays & National Holidays
│
├── 02. Organization Management
│   ├── Organization Profile & Multi-location Offices
│   ├── Department Hierarchy (Parent/Sub-departments with bilingual titles)
│   ├── Position Directory & Grade Levels
│   └── Interactive Organization Chart (Visual Leadership & Department Hierarchy)
│
├── 03. Employee Management
│   ├── Directory with Advanced Search, Multi-Filter, Status Filtering & CSV Export
│   ├── Automatic Unique Employee Code Generator (`EMP-XXXX`)
│   ├── Modal Create Form (Full demographics, initial assignment, hire date)
│   └── 11-Tab Employee Detail View:
│       ├── 1. Overview & Current Placement
│       ├── 2. Personal Information (Dual English/Khmer names, DOB, Gender, Contacts)
│       ├── 3. Employment & Contract Info
│       ├── 4. Assignment History (Complete transfer records)
│       ├── 5. Attendance History
│       ├── 6. Leave Balance & History
│       ├── 7. Compensation & Salary History
│       ├── 8. Education Credentials
│       ├── 9. Prior Work Experience
│       ├── 10. Document Vault (Contracts, IDs, Certifications)
│       └── 11. Emergency Contacts & Activity Log
│
├── 04. Employee Assignment Management (Source of Truth)
│   ├── Dedicated Transfer & Placement Hub
│   ├── Automated previous primary assignment termination upon new transfer start
│   └── Full assignment audit trails with notes and supervisor links
│
├── 05. Attendance Management
│   ├── Daily Attendance Summary & Live Records Table
│   ├── Employee Self-Service Check-in / Check-out
│   ├── Admin Manual Attendance Entry with Reason Notes
│   ├── Employee Attendance Correction Request Modal
│   ├── Supervisor / HR Correction Review Workflow
│   └── Work Shifts (Morning, Standard, Flexible) & Holiday Calendars
│
├── 06. Leave Management
│   ├── Annual, Sick, Maternity, Paternity, and Unpaid Leave Categories
│   ├── Real-time Leave Balances & Entitlement Tracking
│   ├── Two-Tier Approval Engine:
│   │   ├── Tier 1: Department Manager / Supervisor Review
│   │   └── Tier 2: HR Manager Final Approval (Auto-deducts balance)
│   └── Overlapping Leave Prevention & Cancellation Handling
│
├── 07. Payroll Management
│   ├── Multi-Currency Salary Structures (USD & KHR)
│   ├── Automated Monthly Payroll Batch Processing
│   ├── Gross, Allowances, Tax Withholding & Net Calculations
│   ├── Batch Status Workflow: Draft ➔ Reviewed ➔ Approved ➔ Paid
│   └── Interactive, Printable Enterprise Payslips
│
├── 08. Recruitment Management
│   ├── Job Vacancies with Requirements, Salary Range, and Status
│   ├── Candidate Pipeline (Applied, Shortlisted, Interviewed, Offered, Hired)
│   ├── Interview Scheduling with Interviewer Notes
│   └── One-Click Candidate-to-Employee Conversion Modal
│
├── 09. Performance Management
│   ├── Periodic Performance Reviews (Self, Peer, Manager Evaluations)
│   ├── KPI Criteria Management with Weightings and Ratings
│   └── Overall Performance Scores & Manager Feedback
│
├── 10. Training Management
│   ├── Training Programs Catalog with Budgets and Capacities
│   ├── Employee Enrollment and Completion Status Tracking
│   └── Results and Certificate Recording
│
├── 11. Reports & Analytics
│   ├── Executive Summary & Workforce Metrics
│   ├── Attendance & Punctuality Reports (Late rates, total hours worked)
│   ├── Leave Utilization Analytics
│   └── Departmental Payroll Cost Breakdown
│
├── 12. User & Role Management (RBAC)
│   ├── User Directory with Role Assignments
│   ├── 6 System Roles with Permission Matrices
│   └── Account Activation / Deactivation
│
└── 13. System Settings & Communications
    ├── Company Branding, Default Currency, Working Days & Leave Policies
    ├── Company-wide Announcements Board with Priority Flags
    └── Security Audit Log Explorer (User actions, timestamps, IP addresses)
```

---

## 7. API Reference & Postman Collection

The backend provides **94 RESTful endpoints** under the `/api/v1/` prefix.

### Postman Collection
A pre-configured Postman collection is included in the project root:
- **File**: [`StaffStream_EMS.postman_collection.json`](file:///Users/macbook/Workspace/projects/systems/staffstream-ems/StaffStream_EMS.postman_collection.json)

**Features of the Postman Collection:**
- Environment variable `baseUrl` defaulted to `http://127.0.0.1:8000/api/v1`.
- Automatic Token Capture: Running the **Login (Admin)** request automatically populates the `token` variable used by all authenticated endpoints.
- Pre-populated JSON payloads for employee creation, department transfers, attendance check-in/out, leave approvals, payroll batches, and recruitment workflows.

### Essential Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate and obtain Sanctum Bearer token | No |
| `GET` | `/api/v1/auth/me` | Retrieve profile and permissions of authenticated user | Yes |
| `GET` | `/api/v1/dashboard/stats` | Aggregated dashboard metrics and chart series | Yes |
| `GET` | `/api/v1/organization/departments` | List all departments with manager and hierarchy info | Yes |
| `GET` | `/api/v1/organization/chart` | Nested tree structure for visual org chart | Yes |
| `GET` | `/api/v1/employees` | Paginated employee directory with filters | Yes |
| `POST` | `/api/v1/employees` | Create employee and initial primary assignment | Yes |
| `GET` | `/api/v1/employees/{id}` | Full employee detail with all 11 sub-resources | Yes |
| `POST` | `/api/v1/assignments` | Create transfer; auto-terminates previous assignment | Yes |
| `POST` | `/api/v1/attendance/check-in` | Record self-service employee check-in | Yes |
| `POST` | `/api/v1/attendance/check-out` | Record self-service employee check-out | Yes |
| `POST` | `/api/v1/leaves/requests` | Submit leave request | Yes |
| `PUT` | `/api/v1/leaves/requests/{id}/supervisor-review` | Supervisor Tier-1 approval or rejection | Yes |
| `PUT` | `/api/v1/leaves/requests/{id}/hr-review` | HR Tier-2 final approval (deducts balance) | Yes |
| `POST` | `/api/v1/payroll/batches/process` | Calculate monthly payroll batch for all employees | Yes |
| `GET` | `/api/v1/payroll/payslips/{id}` | Fetch detailed printable payslip | Yes |
| `POST` | `/api/v1/recruitment/candidates/{id}/convert-to-employee` | Convert hired candidate into employee profile | Yes |

---

## 8. Automated Testing & Verification

StaffStream EMS includes comprehensive automated feature tests verifying authentication, permission barriers, employee assignment rules, attendance calculations, leave workflows, and payroll generation.

### Run Backend Test Suite
```bash
cd backend
php artisan test
```
**Test Results:**
```text
   PASS  Tests\Feature\EmsApiTest
  ✓ login works and returns token                                   0.16s
  ✓ unauthenticated request returns 401                             0.05s
  ✓ dashboard stats endpoint returns real data                      0.06s
  ✓ employee directory lists employees                              0.07s
  ✓ employee assignment transfer creates new and updates previous   0.09s
  ✓ leave request and two-tier approval deducts balance             0.12s
  ✓ payroll batch processes and creates payslips                    0.10s

  Tests:    7 passed (32 assertions)
  Duration: 0.73s
```

### Run Frontend Static Analysis & Production Build
```bash
cd frontend
npm run build
```
**Build Output:**
```text
✓ 2226 modules transformed.
dist/index.html                     0.93 kB
dist/assets/index-BgwV3MRO.css     34.99 kB
dist/assets/index-4sL_S6GR.js   1,198.44 kB
✓ built in 2.93s
```

---

## 9. Security & Production Best Practices

- **Strict Input Validation**: Every request is validated with Laravel FormRequests and Zod client-side schemas.
- **CSRF & Token Security**: Laravel Sanctum tokens with revoke-on-logout and token invalidation on 401 response interceptors.
- **Secure File Storage**: File uploads are restricted to whitelisted MIME types (PDF, PNG, JPEG, DOCX) and stored in protected storage paths.
- **Audit Logging**: Spatie Activitylog logs model changes, security actions, and user logins with IP addresses and user agents.
- **SQL Injection Prevention**: 100% Eloquent ORM and parameterized queries throughout.

---

## 10. License

StaffStream EMS is open-source software licensed under the **MIT license**.

