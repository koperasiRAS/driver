# TRANS RAS Driver Management System - Specification

## 1. Project Overview

**Project Name:** TRANS RAS Driver Management System
**Project Type:** Full-stack Web Application
**Core Functionality:** A transparent driver activity and deposit monitoring system for cargo transportation businesses
**Target Users:** Business owners (single owner) and drivers

---

## 2. UI/UX Specification

### Layout Structure

**Global Layout:**
- Sidebar navigation (collapsible on mobile)
- Top header with user info and logout
- Main content area with padding
- Responsive design for mobile/tablet/desktop

**Page Sections:**
- Login page: Centered card with logo and form
- Dashboard: Stats cards + data tables
- Reports: Form + history table
- Deposits: Form + history table
- Settings: Profile management

**Responsive Breakpoints:**
- Mobile: < 640px (single column, hamburger menu)
- Tablet: 640px - 1024px (collapsible sidebar)
- Desktop: > 1024px (fixed sidebar)

### Visual Design

**Color Palette:**
- Primary: `#0F766E` (teal-700) - Main brand color
- Primary Dark: `#0D9488` (teal-600) - Hover states
- Secondary: `#1E293B` (slate-800) - Sidebar
- Accent Success: `#10B981` (emerald-500) - Approved/Success
- Accent Warning: `#F59E0B` (amber-500) - Pending
- Accent Danger: `#EF4444` (red-500) - Rejected/Error
- Background: `#F8FAFC` (slate-50) - Page background
- Card: `#FFFFFF` - Card background
- Text Primary: `#1E293B` (slate-800)
- Text Secondary: `#64748B` (slate-500)
- Border: `#E2E8F0` (slate-200)

**Typography:**
- Font Family: `Inter` (Google Font)
- Headings:
  - H1: 32px, font-weight 700
  - H2: 24px, font-weight 600
  - H3: 20px, font-weight 600
  - H4: 16px, font-weight 600
- Body: 14px, font-weight 400
- Small: 12px, font-weight 400

**Spacing System:**
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px
- Card padding: 24px
- Section gap: 24px
- Form gap: 16px

**Visual Effects:**
- Card shadows: `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`
- Hover shadow: `0 4px 6px rgba(0,0,0,0.1)`
- Border radius: 8px (cards), 6px (buttons), 4px (inputs)
- Transitions: 150ms ease-in-out

### Components

**Buttons:**
- Primary: Teal background, white text
- Secondary: White background, teal border/text
- Danger: Red background, white text
- States: Default, hover (darker), disabled (opacity 50%)

**Form Inputs:**
- Border: 1px solid slate-200
- Focus: 2px teal ring
- Error: Red border + error message
- Height: 40px

**Tables:**
- Striped rows (alternating slate-50/white)
- Hover row highlight
- Sticky header
- Pagination controls

**Cards:**
- White background
- Rounded corners (8px)
- Subtle shadow
- 24px padding

**Status Badges:**
- Pending: Amber background
- Approved: Emerald background
- Rejected: Red background
- NARIK: Teal background
- TIDAK NARIK: Slate background

**Empty States:**
- Centered icon (64px)
- Title text (20px, semibold)
- Description text (14px, secondary)
- Optional action button

---

## 3. Functionality Specification

### Authentication

**Login:**
- Email + password login via Supabase Auth
- Role-based redirect (owner → owner dashboard, driver → driver dashboard)
- Session persistence

**Logout:**
- Clear session
- Redirect to login

### Owner Features

**Dashboard:**
- Total drivers count
- Today's reports count
- Pending deposits count
- Monthly deposit progress (total vs target)
- Recent activity feed

**Driver Management:**
- List all drivers with status
- Add new driver (name, email, phone, vehicle info)
- View driver details
- Deactivate driver

**Daily Reports:**
- View all reports with filters (date, driver, status)
- Filter by date range
- Filter by driver
- View report details with photo

**Deposits:**
- View all deposits
- Approve/reject pending deposits
- View deposit proof photos

**Analytics:**
- Monthly deposit chart (bar chart)
- Driver performance table
- Deposit vs target comparison

### Driver Features

**Dashboard:**
- Today's report status (submitted/not)
- Daily target display
- Monthly progress (deposits vs target)
- Recent reports list

**Submit Report:**
- Choose NARIK or TIDAK NARIK
- If NARIK: income, orders count, platform, photo, notes
- If TIDAK NARIK: reason, optional photo, notes
- Deadline warning at 23:50 WIB

**Report History:**
- List own reports
- View details (read-only after 2 hours)

**Deposits:**
- Submit new deposit (amount, method, photo, date)
- View deposit history
- View status (pending/approved/rejected)

### Business Rules Implementation

**Daily Target:**
- 170,000 IDR per day

**Deposit Frequency:**
- Every 2 days (displayed as reminder)

**Monthly Calculation:**
- 22 working days × 170,000 = 3,740,000 IDR target

**Report Deadline:**
- Hard cut-off at 23:50 WIB (Asia/Jakarta)
- Visual warning at 23:30 WIB

**Report Editing:**
- Locked after 2 hours from submission timestamp

**Proof Photo:**
- Required if daily_income > 0

---

## 4. Database Schema

### Table: profiles
```sql
- id: uuid (FK to auth.users)
- email: text
- full_name: text
- role: text ('owner' | 'driver')
- phone: text
- created_at: timestamptz
- updated_at: timestamptz
```

### Table: drivers
```sql
- id: uuid (PK)
- user_id: uuid (FK to profiles)
- vehicle_type: text
- vehicle_plate: text
- is_active: boolean (default true)
- created_at: timestamptz
- updated_at: timestamptz
```

### Table: daily_reports
```sql
- id: uuid (PK)
- driver_id: uuid (FK to drivers)
- report_date: date
- status: text ('narik' | 'tidak_narik')
- daily_income: numeric
- number_of_orders: integer
- platform: text ('lalamove' | 'direct_call' | 'mixed')
- reason: text (for tidak_narik)
- notes: text
- photo_url: text
- is_locked: boolean (default false)
- submitted_at: timestamptz
- created_at: timestamptz
```

### Table: deposits
```sql
- id: uuid (PK)
- driver_id: uuid (FK to drivers)
- amount: numeric
- method: text ('cash' | 'transfer')
- proof_photo_url: text
- deposit_date: date
- status: text ('pending' | 'approved' | 'rejected')
- reviewed_by: uuid (FK to profiles)
- reviewed_at: timestamptz
- created_at: timestamptz
```

### Table: audit_logs
```sql
- id: uuid (PK)
- user_id: uuid (FK to profiles)
- action: text
- table_name: text
- record_id: uuid
- old_values: jsonb
- new_values: jsonb
- created_at: timestamptz
```

### Table: driver_locations
```sql
- id: uuid (PK)
- driver_id: uuid (FK to drivers)
- latitude: numeric
- longitude: numeric
- recorded_at: timestamptz
```

---

## 5. Row Level Security (RLS)

### Profiles
- Owner: SELECT all, UPDATE own
- Driver: SELECT, UPDATE own

### Drivers
- Owner: SELECT all
- Driver: SELECT where user_id = auth.uid()

### Daily Reports
- Owner: SELECT all
- Driver: SELECT where driver.user_id = auth.uid()

### Deposits
- Owner: SELECT all, UPDATE all
- Driver: SELECT where driver.user_id = auth.uid(), INSERT own

### Audit Logs
- Owner: SELECT all
- Driver: No access

---

## 6. API Endpoints (via Next.js Server Actions)

### Authentication
- `POST /api/auth/login` - Handle login
- `POST /api/auth/logout` - Handle logout

### Reports
- `GET /api/reports` - List reports (filtered by role)
- `POST /api/reports` - Create report
- `GET /api/reports/[id]` - Get single report
- `PATCH /api/reports/[id]` - Update report (if within 2 hours)

### Deposits
- `GET /api/deposits` - List deposits (filtered by role)
- `POST /api/deposits` - Create deposit
- `PATCH /api/deposits/[id]` - Update status (owner only)

### Drivers
- `GET /api/drivers` - List drivers (owner only)
- `POST /api/drivers` - Create driver (owner only)
- `GET /api/drivers/[id]` - Get driver details
- `PATCH /api/drivers/[id]` - Update driver

### Analytics
- `GET /api/analytics/monthly` - Monthly stats
- `GET /api/analytics/driver/[id]` - Driver-specific stats

---

## 7. Acceptance Criteria

### Authentication
- [ ] User can log in with email/password
- [ ] User is redirected based on role
- [ ] Session persists on refresh
- [ ] User can log out

### Owner Dashboard
- [ ] Shows total driver count
- [ ] Shows today's report count
- [ ] Shows pending deposits
- [ ] Shows monthly progress

### Driver Dashboard
- [ ] Shows today's report status
- [ ] Shows daily target
- [ ] Shows monthly progress
- [ ] Shows recent reports

### Report Submission
- [ ] Driver can select NARIK or TIDAK NARIK
- [ ] NARIK form shows income, orders, platform, photo, notes
- [ ] TIDAK NARIK form shows reason, photo, notes
- [ ] Photo upload works
- [ ] Report saves with server timestamp
- [ ] Cannot backdate reports

### Report Viewing
- [ ] Driver sees only own reports
- [ ] Owner sees all reports
- [ ] Reports locked after 2 hours
- [ ] Empty state shows when no reports

### Deposit Submission
- [ ] Driver can submit deposit
- [ ] Photo upload works
- [ ] Status starts as pending

### Deposit Management
- [ ] Owner sees all deposits
- [ ] Owner can approve/reject
- [ ] Driver sees only own deposits
- [ ] Status updates correctly

### Security
- [ ] RLS policies enforced
- [ ] Drivers cannot see other drivers' data
- [ ] Only owner can manage drivers

### Empty States
- [ ] "No drivers yet" shown when empty
- [ ] "No reports yet" shown when empty
- [ ] "No deposits yet" shown when empty

---

## 8. Project Structure

```
/app
  /api
    /auth
      /login/route.ts
      /logout/route.ts
    /reports/route.ts
    /deposits/route.ts
    /drivers/route.ts
    /analytics/route.ts
  /(auth)
    /login/page.tsx
  /(dashboard)
    /layout.tsx
    /owner/page.tsx
    /owner/drivers/page.tsx
    /owner/reports/page.tsx
    /owner/deposits/page.tsx
    /owner/analytics/page.tsx
    /driver/page.tsx
    /driver/report/page.tsx
    /driver/reports/page.tsx
    /driver/deposits/page.tsx
  /layout.tsx
  /page.tsx
/components
  /ui (Button, Input, Card, Badge, etc.)
  /forms (ReportForm, DepositForm, etc.)
  /tables (ReportsTable, DepositsTable, etc.)
  /charts (MonthlyChart, ProgressBar)
  /layout (Sidebar, Header)
  /common (EmptyState, LoadingSpinner)
/lib
  /supabase.ts (client)
  /utils.ts
  /constants.ts
/services
  /reports.ts
  /deposits.ts
  /drivers.ts
  /analytics.ts
  /auth.ts
/types
  /index.ts
```

---

## 9. Technical Notes

### Supabase Configuration
- Use environment variables for Supabase URL and anon key
- Client-side: @supabase/supabase-js
- Server-side: Supabase server client with cookies

### Date/Time Handling
- All timestamps in UTC internally
- Display in Asia/Jakarta timezone
- Use date-fns for formatting

### File Upload
- Max file size: 5MB
- Accepted types: image/jpeg, image/png, image/webp
- Generate unique filename with timestamp

### Error Handling
- Form validation on client and server
- Display user-friendly error messages
- Log errors for debugging
