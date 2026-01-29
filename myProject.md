# myProject --- Maintenance Request System Spec

## Overview

Web-based maintenance request platform for multi-branch organizations.
Stack: Next.js + Tailwind CSS + Supabase (Auth, Postgres, Storage,
Realtime).

------------------------------------------------------------------------

## Roles

-   Branch User
-   Central Admin
-   Technician (Internal)
-   External Vendor

------------------------------------------------------------------------

## Core Features

-   Authentication & role-based access
-   Branch selection
-   Maintenance request form
-   Status tracking
-   Realtime chat
-   Vendor directory & contact info
-   Dashboard (all branches / filtered)
-   Assign internal & external technicians
-   SLA definition & breach tracking
-   Cost logging
-   Upload worksheets / receipts
-   Close jobs
-   Export Excel / PDF

------------------------------------------------------------------------

## Architecture

Browser/Mobile\
→ Next.js Frontend\
→ Supabase Auth + RLS\
→ Postgres Database\
→ Storage Buckets\
→ Realtime Channels\
→ Edge Functions (notifications, SLA cron)

------------------------------------------------------------------------

# =========================

# DATABASE DESIGN (FULL)

# =========================

## ENUM TYPES

-   role_enum: branch, admin, technician, vendor
-   priority_enum: low, medium, high, critical
-   status_enum: pending, assigned, in_progress, completed, cancelled
-   attachment_type_enum: image, receipt, worksheet

------------------------------------------------------------------------

## TABLE: branches

  column       type          note
  ------------ ------------- ---------------------------
  id           uuid PK       default gen_random_uuid()
  code         text          unique
  name         text          
  region       text          
  created_at   timestamptz   default now()

Indexes: - unique(code)

------------------------------------------------------------------------

## TABLE: profiles

  column       type                    note
  ------------ ----------------------- --------------------
  id           uuid PK                 FK → auth.users.id
  name         text                    
  role         role_enum               
  branch_id    uuid FK → branches.id   nullable for admin
  phone        text                    
  created_at   timestamptz             default now()

Indexes: - idx_profiles_branch(branch_id) - idx_profiles_role(role)

------------------------------------------------------------------------

## TABLE: vendors

  column         type          note
  -------------- ------------- ---------------
  id             uuid PK       
  company_name   text          
  contact_name   text          
  phone          text          
  email          text          
  address        text          
  created_at     timestamptz   default now()

Indexes: - idx_vendors_company(company_name)

------------------------------------------------------------------------

## TABLE: maintenance_requests

  column               type                    note
  -------------------- ----------------------- ---------------
  id                   uuid PK                 
  branch_id            uuid FK → branches.id   
  created_by           uuid FK → profiles.id   
  title                text                    
  description          text                    
  category             text                    
  priority             priority_enum           
  status               status_enum             
  sla_hours            int                     
  due_at               timestamptz             calculated
  assigned_user_id     uuid FK → profiles.id   nullable
  assigned_vendor_id   uuid FK → vendors.id    nullable
  estimated_cost       numeric                 
  actual_cost          numeric                 
  created_at           timestamptz             default now()

Indexes: - idx_requests_branch(branch_id) -
idx_requests_status(status) - idx_requests_priority(priority) -
idx_requests_due(due_at)

------------------------------------------------------------------------

## TABLE: chats

  column       type                                note
  ------------ ----------------------------------- ---------------
  id           uuid PK                             
  request_id   uuid FK → maintenance_requests.id   
  sender_id    uuid FK → profiles.id               
  message      text                                
  created_at   timestamptz                         default now()

Indexes: - idx_chats_request(request_id)

------------------------------------------------------------------------

## TABLE: attachments

  column        type                                note
  ------------- ----------------------------------- ---------------
  id            uuid PK                             
  request_id    uuid FK → maintenance_requests.id   
  uploaded_by   uuid FK → profiles.id               
  file_url      text                                
  type          attachment_type_enum                
  created_at    timestamptz                         default now()

Indexes: - idx_attach_request(request_id)

------------------------------------------------------------------------

## TABLE: sla_logs

  column        type                                note
  ------------- ----------------------------------- ------
  id            uuid PK                             
  request_id    uuid FK → maintenance_requests.id   
  started_at    timestamptz                         
  resolved_at   timestamptz                         
  breached      boolean                             

Indexes: - idx_sla_request(request_id)

------------------------------------------------------------------------

## TABLE: status_logs

  column       type                                note
  ------------ ----------------------------------- ---------------
  id           uuid PK                             
  request_id   uuid FK → maintenance_requests.id   
  status       status_enum                         
  changed_by   uuid FK → profiles.id               
  created_at   timestamptz                         default now()

Indexes: - idx_status_request(request_id)

------------------------------------------------------------------------

## TABLE: cost_logs

  column        type                                note
  ------------- ----------------------------------- ---------------
  id            uuid PK                             
  request_id    uuid FK → maintenance_requests.id   
  amount        numeric                             
  description   text                                
  added_by      uuid FK → profiles.id               
  created_at    timestamptz                         default now()

Indexes: - idx_cost_request(request_id)

------------------------------------------------------------------------

## RELATIONSHIPS

branches 1..\* profiles\
branches 1..\* maintenance_requests

profiles 1..\* maintenance_requests (created_by)\
profiles 1..\* chats\
profiles 1..\* attachments

maintenance_requests 1..\* chats\
maintenance_requests 1..\* attachments\
maintenance_requests 1..\* sla_logs\
maintenance_requests 1..\* status_logs\
maintenance_requests 1..\* cost_logs

vendors 1..\* maintenance_requests\
profiles (technician) 1..\* maintenance_requests

------------------------------------------------------------------------

## RLS STRATEGY (Supabase)

-   Branch users: only rows where branch_id = profile.branch_id
-   Admin: full access
-   Technician: assigned_user_id = auth.uid()
-   Vendor: assigned_vendor_id mapped to vendor profile
-   Chats/attachments inherit access from maintenance_requests

------------------------------------------------------------------------

# =========================

# AUTHORIZATION --- NEXT.JS

# =========================

## Goals

-   Protect routes by login status
-   Restrict pages by role
-   Always rely on Supabase RLS for data security
-   Use Server Components for fetching protected data

------------------------------------------------------------------------

## Folder Layout

/app /admin layout.tsx page.tsx /tech layout.tsx /(branch) layout.tsx
/login

------------------------------------------------------------------------

## Supabase Server Helper

``` ts
// lib/supabase/server.ts
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const supabaseServer = () =>
  createServerComponentClient({ cookies });
```

------------------------------------------------------------------------

## Load Session + Profile

``` ts
const supabase = supabaseServer();

const {
  data: { session },
} = await supabase.auth.getSession();

if (!session) redirect("/login");

const { data: profile } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", session.user.id)
  .single();
```

------------------------------------------------------------------------

## Role Guard Example

``` ts
if (profile.role !== "admin") {
  redirect("/unauthorized");
}
```

------------------------------------------------------------------------

## Middleware Route Protection

``` ts
// middleware.ts
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const protectedRoutes = ["/admin", "/tech", "/requests"];

  if (
    protectedRoutes.some((path) =>
      req.nextUrl.pathname.startsWith(path)
    ) &&
    !session
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}
```

------------------------------------------------------------------------

## Flow

Login\
→ Middleware session check\
→ Load profile\
→ Role guard in layout/page\
→ Query DB (RLS enforced)

------------------------------------------------------------------------

# =========================

# PAGES

# =========================

### Branch

-   /login
-   /requests
-   /requests/new
-   /requests/\[id\]

### Admin

-   /admin/dashboard
-   /admin/requests
-   /admin/vendors
-   /admin/reports

### Technician

-   /tech/jobs

------------------------------------------------------------------------

# =========================

# DEVELOPMENT PHASES

# =========================

### Phase 1 (MVP)

-   Auth & roles
-   Branch CRUD
-   Create request
-   Dashboard
-   Assign jobs
-   Realtime chat

### Phase 2

-   SLA automation
-   Notifications
-   Vendor system
-   Cost tracking
-   Export Excel/PDF

------------------------------------------------------------------------

## Notes

-   Separate Storage buckets: images, receipts, worksheets.
-   Scheduled Edge Functions to detect SLA breach.
-   Audit trail via status_logs & cost_logs.
