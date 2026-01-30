import { createClient } from '@/lib/supabase/client'
import type { Organization, Company, Brand, Branch, Profile } from '@/types/database.types'

export interface TenantContext {
  organization: Organization | null
  company: Company | null
  brand: Brand | null
}

export interface OrganizationWithRelations extends Organization {
  companies: (Company & {
    brands: Brand[]
  })[]
}

/**
 * Get the current user's tenant context
 */
export async function getTenantContext(userId: string): Promise<TenantContext> {
  const supabase = createClient()

  // Get user profile with organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single() as { data: { organization_id: string | null } | null }

  if (!profile?.organization_id) {
    return { organization: null, company: null, brand: null }
  }

  // Get organization
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.organization_id)
    .single() as { data: Organization | null }

  return {
    organization: organization || null,
    company: null, // Can be set based on user preference or URL
    brand: null,
  }
}

/**
 * Get organization hierarchy
 */
export async function getOrganizationHierarchy(
  organizationId: string
): Promise<OrganizationWithRelations | null> {
  const supabase = createClient()

  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single() as { data: Organization | null }

  if (!organization) return null

  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name') as { data: Company[] | null }

  const companiesWithBrands = await Promise.all(
    (companies || []).map(async (company) => {
      const { data: brands } = await supabase
        .from('brands')
        .select('*')
        .eq('company_id', company.id)
        .eq('is_active', true)
        .order('name') as { data: Brand[] | null }

      return {
        ...company,
        brands: brands || [],
      }
    })
  )

  return {
    ...organization,
    companies: companiesWithBrands,
  }
}

/**
 * Create a new organization
 */
export async function createOrganization(
  name: string,
  slug: string,
  logoUrl?: string
): Promise<{ organization: Organization | null; error?: string }> {
  const supabase = createClient()

  // Check if slug is unique
  const { data: existing } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single() as { data: { id: string } | null }

  if (existing) {
    return { organization: null, error: 'Slug นี้ถูกใช้งานแล้ว' }
  }

  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name,
      slug,
      logo_url: logoUrl,
    } as never)
    .select()
    .single() as { data: Organization | null; error: unknown }

  if (error) {
    return { organization: null, error: 'ไม่สามารถสร้างองค์กรได้' }
  }

  return { organization: data }
}

/**
 * Create a new company under an organization
 */
export async function createCompany(
  organizationId: string,
  name: string,
  code: string,
  logoUrl?: string
): Promise<{ company: Company | null; error?: string }> {
  const supabase = createClient()

  // Check if code is unique within organization
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('code', code)
    .single() as { data: { id: string } | null }

  if (existing) {
    return { company: null, error: 'รหัสบริษัทนี้ถูกใช้งานแล้ว' }
  }

  const { data, error } = await supabase
    .from('companies')
    .insert({
      organization_id: organizationId,
      name,
      code,
      logo_url: logoUrl,
    } as never)
    .select()
    .single() as { data: Company | null; error: unknown }

  if (error) {
    return { company: null, error: 'ไม่สามารถสร้างบริษัทได้' }
  }

  return { company: data }
}

/**
 * Create a new brand under a company
 */
export async function createBrand(
  companyId: string,
  name: string,
  code: string,
  colorPrimary?: string,
  colorSecondary?: string,
  logoUrl?: string
): Promise<{ brand: Brand | null; error?: string }> {
  const supabase = createClient()

  // Check if code is unique within company
  const { data: existing } = await supabase
    .from('brands')
    .select('id')
    .eq('company_id', companyId)
    .eq('code', code)
    .single() as { data: { id: string } | null }

  if (existing) {
    return { brand: null, error: 'รหัสแบรนด์นี้ถูกใช้งานแล้ว' }
  }

  const { data, error } = await supabase
    .from('brands')
    .insert({
      company_id: companyId,
      name,
      code,
      logo_url: logoUrl,
      color_primary: colorPrimary || '#4A7C59',
      color_secondary: colorSecondary || '#D4A574',
    } as never)
    .select()
    .single() as { data: Brand | null; error: unknown }

  if (error) {
    return { brand: null, error: 'ไม่สามารถสร้างแบรนด์ได้' }
  }

  return { brand: data }
}

/**
 * Assign a user to an organization
 */
export async function assignUserToOrganization(
  userId: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ organization_id: organizationId } as never)
    .eq('id', userId)

  if (error) {
    return { success: false, error: 'ไม่สามารถมอบหมายผู้ใช้ได้' }
  }

  return { success: true }
}

/**
 * Get branches for a brand
 */
export async function getBranchesForBrand(brandId: string): Promise<Branch[]> {
  const supabase = createClient()

  const { data } = await supabase
    .from('branches')
    .select('*')
    .eq('brand_id', brandId)
    .order('name') as { data: Branch[] | null }

  return data || []
}

/**
 * Get all users in an organization
 */
export async function getOrganizationUsers(organizationId: string): Promise<Profile[]> {
  const supabase = createClient()

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name') as { data: Profile[] | null }

  return data || []
}

/**
 * Generate a slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Format organization display name with hierarchy
 */
export function formatTenantPath(
  organization?: Organization | null,
  company?: Company | null,
  brand?: Brand | null
): string {
  const parts: string[] = []
  if (organization) parts.push(organization.name)
  if (company) parts.push(company.name)
  if (brand) parts.push(brand.name)
  return parts.join(' > ')
}
