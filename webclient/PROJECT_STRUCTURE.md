# 📁 រចនាសម្ព័ន្ធគម្រោង (Project Structure) - StaffStream EMS Webclient

គម្រោងត្រូវបានរៀបចំតាមទម្រង់ស្តង់ដារ Enterprise Modular Architecture ដូចខាងក្រោម៖

```
webclient/
├── public/                       # Static files, icons, pwa manifest, hospital branding
│   ├── images/                   # Default avatars, brand logos, badges
│   ├── favicon.svg / favicon.ico # Favicons & web identity
│   ├── hospital-logo.png         # មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិន ត្បូងឃ្មុំ
│   └── site.webmanifest          # PWA Web App Manifest
├── src/                          # កូដកម្មវិធីប្រភពដើមទាំងមូល (Application Source Code)
│   ├── api/                      # Axios HTTP instance, request/response interceptors (client.ts)
│   ├── assets/                   # Static imported images, icons, and SVG illustrations
│   ├── components/               # UI Components ចែកតាមកម្រិត reusable និង domain
│   │   ├── common/               # Shared general components (Buttons, Badges, Modals, Tables)
│   │   ├── layout/               # Header, Sidebar, Footer, AdminLayout
│   │   ├── shared/               # Enterprise shared logic (SearchInput, Pagination, Export, Print)
│   │   └── ui/                   # Radix + Tailwind base primitives (dialog, alert, sheet, button)
│   ├── config/                   # Global configuration & app constants
│   ├── hooks/                    # Reusable React hooks (useAuth, usePermission, useDebounce, etc.)
│   ├── lib/                      # Third-party library initializations (i18n, utils)
│   ├── locales/                  # វចនានុក្រមបកប្រែភាសា (en / km) ចែកតាម domain
│   │   ├── en/                   # Translation files សម្រាប់ភាសាអង់គ្លេស
│   │   └── km/                   # Translation files សម្រាប់ភាសាខ្មែរ
│   ├── pages/                    # EMS Business Modules
│   │   ├── auth/                 # ផ្ទាំងចូលប្រព័ន្ធ (Login & Token Session)
│   │   ├── dashboard/            # ផ្ទាំងគ្រប់គ្រងទូទៅ (Executive BI Dashboard)
│   │   ├── organization/         # រចនាសម្ព័ន្ធស្ថាប័ន (Departments, Positions, Locations, Org Chart)
│   │   ├── employees/            # បញ្ជីរាយនាមបុគ្គលិក ប្រវត្តិរូប និងឯកសារ (Directory, Details, Docs)
│   │   ├── assignments/          # ការចាត់តាំង និងផ្ទេរការងារ (Primary Source of Truth)
│   │   ├── attendance/           # កត់ត្រាវត្តមាន ស្កេនចូលចេញ និងកែតម្រូវ
│   │   ├── shifts/               # កាលវិភាគ និងវេនការងារពេទ្យ (Hospital Shifts Roster)
│   │   ├── leave/                # ការគ្រប់គ្រងច្បាប់ឈប់ (Requests, Approvals, Balances)
│   │   ├── payroll/              # បៀវត្សរ៍ ប្រាក់ឧបត្ថម្ភ និងការបើកប្រាក់ប្រចាំខែ (Batches, Payslips)
│   │   ├── performance/          # ការវាយតម្លៃប្រសិទ្ធភាពការងារ និងវគ្គបណ្តុះបណ្តាល
│   │   ├── recruitment/          # ការជ្រើសរើសបុគ្គលិក បេក្ខជន និងការសម្ភាសន៍
│   │   ├── reports/              # របាយការណ៍បុគ្គលិក វត្តមាន ច្បាប់ និងបៀវត្សរ៍
│   │   ├── users/                # ការគ្រប់គ្រងគណនី និងសិទ្ធិ (Users & RBAC Roles)
│   │   ├── settings/             # ការកំណត់ប្រព័ន្ធទូទៅ និងសេចក្តីជូនដំណឹង
│   │   └── profile/              # គណនីផ្ទាល់ខ្លួនរបស់ Admin / Staff
│   ├── routes/                   # Routing Configurations & Authorization Guards
│   │   ├── guards/               # ProtectedRoute (Auth & Permission check) & PublicRoute
│   │   ├── components/           # PageFallback (Suspense loading spinner)
│   │   └── AppRoutes.tsx         # Lazy loading route definitions ទាំងអស់
│   ├── services/                 # Pure API Service Files
│   │   ├── authService.ts        # Authentication API service
│   │   ├── employeeService.ts    # Employee management API service
│   │   ├── organizationService.ts# Organization & department API service
│   │   ├── attendanceService.ts  # Attendance & punch API service
│   │   ├── leaveService.ts       # Leave requests & balances API service
│   │   ├── payrollService.ts     # Payroll batches & structures API service
│   │   ├── recruitmentService.ts # Candidates & vacancies API service
│   │   ├── performanceService.ts # Performance reviews & training API service
│   │   ├── reportService.ts      # Analytics & reports API service
│   │   ├── userService.ts        # Users & roles API service
│   │   ├── settingsService.ts    # System settings API service
│   │   └── profileService.ts     # User profile API service
│   ├── stores/                   # Zustand Global Stores (Auth, Locale, Theme)
│   ├── types/                    # TypeScript Global Interface & Declarations
│   ├── utils/                    # Global Formatters, Validations
│   ├── App.css / App.tsx         # Root component & styling
│   ├── index.css                 # Tailwind CSS directives, typography, theme variables
│   └── main.tsx                  # Application bootstrap entry point
├── .env                          # Local Environment variables
├── .env.example                  # Example local environment settings
├── .env.production               # Production Environment variables
├── .env.production.example       # Example production environment settings
├── .env.staging.example          # Example staging environment settings
├── components.json               # Shadcn/Radix component generator settings
├── Dockerfile                    # Multi-stage production container build (Node + Nginx)
├── nginx.conf                    # Nginx reverse proxy, gzip compression, SPA history fallback
├── package.json                  # Dependencies, devDependencies, and build scripts
├── postcss.config.js             # PostCSS Tailwind plugins config
├── tailwind.config.js            # Tailwind Theme tokens, colors, custom animations
├── tsconfig.json                 # TypeScript project reference config
├── tsconfig.app.json             # App TypeScript compilation options
├── tsconfig.node.json            # Node/Vite build tool compilation options
├── vercel.json                   # Vercel deployment routes and SPA rewrites
└── vite.config.ts                # Vite plugins, path aliases (`@/*`), build chunk splitting
```
