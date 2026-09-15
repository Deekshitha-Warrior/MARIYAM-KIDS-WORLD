-- Migration: 20260915_0019_organization_and_branches.sql
-- Description: Creates organizations, branches, branch_memberships, and updates profiles for multi-branch support

BEGIN;

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Branches Table
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  branch_type TEXT NOT NULL DEFAULT 'retail',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, code)
);

-- 3. Branch Memberships Table
CREATE TABLE IF NOT EXISTS public.branch_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('staff', 'manager')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, branch_id)
);

-- 4. Update profiles role constraint & add default_branch_id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'customer', 'staff'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_branches_organization ON public.branches(organization_id);
CREATE INDEX IF NOT EXISTS idx_branches_code ON public.branches(code);
CREATE INDEX IF NOT EXISTS idx_branch_memberships_user ON public.branch_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_branch_memberships_branch ON public.branch_memberships(branch_id);

-- 6. Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_memberships ENABLE ROW LEVEL SECURITY;

-- Temporary open read policy for setup (to be replaced in 0023 with strict branch auth)
DROP POLICY IF EXISTS org_read ON public.organizations;
CREATE POLICY org_read ON public.organizations FOR SELECT TO authenticated, anon USING (is_active = TRUE);

DROP POLICY IF EXISTS branches_read ON public.branches;
CREATE POLICY branches_read ON public.branches FOR SELECT TO authenticated, anon USING (is_active = TRUE);

DROP POLICY IF EXISTS memberships_self_read ON public.branch_memberships;
CREATE POLICY memberships_self_read ON public.branch_memberships FOR SELECT TO authenticated USING (user_id = auth.uid());

COMMIT;
