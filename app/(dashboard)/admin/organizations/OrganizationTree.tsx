'use client'

import { useState } from 'react'
import {
  Building2,
  ChevronRight,
  ChevronDown,
  Users,
  MapPin,
  Edit,
  Plus,
  Settings,
  Palette,
} from 'lucide-react'
import type { Organization, Company, Brand } from '@/types/database.types'
import { clsx } from 'clsx'

type CompanyWithBrands = Company & {
  brands: Brand[]
  _count?: { branches: number }
}

type OrganizationWithCompanies = Organization & {
  companies: CompanyWithBrands[]
  _count?: { users: number }
}

interface OrganizationTreeProps {
  organizations: OrganizationWithCompanies[]
}

export default function OrganizationTree({ organizations }: OrganizationTreeProps) {
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set())
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set())

  const toggleOrg = (orgId: string) => {
    setExpandedOrgs((prev) => {
      const next = new Set(prev)
      if (next.has(orgId)) {
        next.delete(orgId)
      } else {
        next.add(orgId)
      }
      return next
    })
  }

  const toggleCompany = (companyId: string) => {
    setExpandedCompanies((prev) => {
      const next = new Set(prev)
      if (next.has(companyId)) {
        next.delete(companyId)
      } else {
        next.add(companyId)
      }
      return next
    })
  }

  return (
    <div className="space-y-3">
      {organizations.map((org) => {
        const isOrgExpanded = expandedOrgs.has(org.id)

        return (
          <div
            key={org.id}
            className="border-2 border-purple-200 rounded-xl overflow-hidden bg-purple-50/50"
          >
            {/* Organization Header */}
            <div className="flex items-center gap-3 p-4">
              <button
                onClick={() => toggleOrg(org.id)}
                className="p-1 hover:bg-purple-200 rounded-lg transition-colors"
              >
                {isOrgExpanded ? (
                  <ChevronDown className="h-5 w-5 text-purple-600" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-purple-600" />
                )}
              </button>

              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center flex-shrink-0">
                {org.logo_url ? (
                  <img
                    src={org.logo_url}
                    alt={org.name}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <Building2 className="h-6 w-6 text-white" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-coffee-900">{org.name}</h3>
                <div className="flex items-center gap-3 text-sm text-coffee-500">
                  <span className="font-mono text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded">
                    {org.slug}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {org.companies.length} บริษัท
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {org._count?.users || 0} ผู้ใช้
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="p-2 hover:bg-purple-200 rounded-lg transition-colors"
                  title="เพิ่มบริษัท"
                >
                  <Plus className="h-4 w-4 text-purple-600" />
                </button>
                <button
                  className="p-2 hover:bg-purple-200 rounded-lg transition-colors"
                  title="แก้ไข"
                >
                  <Edit className="h-4 w-4 text-purple-600" />
                </button>
              </div>
            </div>

            {/* Companies */}
            {isOrgExpanded && org.companies.length > 0 && (
              <div className="border-t border-purple-200 bg-white">
                {org.companies.map((company) => {
                  const isCompanyExpanded = expandedCompanies.has(company.id)

                  return (
                    <div key={company.id} className="border-b border-coffee-100 last:border-b-0">
                      {/* Company Header */}
                      <div className="flex items-center gap-3 p-4 pl-12">
                        <button
                          onClick={() => toggleCompany(company.id)}
                          className="p-1 hover:bg-sky-100 rounded-lg transition-colors"
                          disabled={company.brands.length === 0}
                        >
                          {company.brands.length > 0 ? (
                            isCompanyExpanded ? (
                              <ChevronDown className="h-5 w-5 text-sky-600" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-sky-600" />
                            )
                          ) : (
                            <div className="w-5 h-5" />
                          )}
                        </button>

                        <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          {company.logo_url ? (
                            <img
                              src={company.logo_url}
                              alt={company.name}
                              className="w-6 h-6 object-contain"
                            />
                          ) : (
                            <Building2 className="h-5 w-5 text-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-coffee-900">{company.name}</h4>
                          <div className="flex items-center gap-3 text-sm text-coffee-500">
                            <span className="font-mono text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded">
                              {company.code}
                            </span>
                            <span className="flex items-center gap-1">
                              <Palette className="h-3.5 w-3.5" />
                              {company.brands.length} แบรนด์
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 hover:bg-sky-100 rounded-lg transition-colors"
                            title="เพิ่มแบรนด์"
                          >
                            <Plus className="h-4 w-4 text-sky-600" />
                          </button>
                          <button
                            className="p-2 hover:bg-sky-100 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <Edit className="h-4 w-4 text-sky-600" />
                          </button>
                        </div>
                      </div>

                      {/* Brands */}
                      {isCompanyExpanded && company.brands.length > 0 && (
                        <div className="bg-cream-50 border-t border-coffee-100">
                          {company.brands.map((brand) => (
                            <div
                              key={brand.id}
                              className="flex items-center gap-3 p-3 pl-20 hover:bg-cream-100 transition-colors border-b border-coffee-100 last:border-b-0"
                            >
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  backgroundColor: brand.color_primary || '#4A7C59',
                                }}
                              >
                                {brand.logo_url ? (
                                  <img
                                    src={brand.logo_url}
                                    alt={brand.name}
                                    className="w-5 h-5 object-contain"
                                  />
                                ) : (
                                  <Palette className="h-4 w-4 text-white" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-coffee-800 text-sm">
                                  {brand.name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-coffee-500">
                                  <span className="font-mono bg-coffee-100 px-1.5 py-0.5 rounded">
                                    {brand.code}
                                  </span>
                                  <span
                                    className="w-3 h-3 rounded-full border border-coffee-200"
                                    style={{ backgroundColor: brand.color_primary || '#4A7C59' }}
                                    title="Primary Color"
                                  />
                                  <span
                                    className="w-3 h-3 rounded-full border border-coffee-200"
                                    style={{ backgroundColor: brand.color_secondary || '#D4A574' }}
                                    title="Secondary Color"
                                  />
                                </div>
                              </div>

                              <button
                                className="p-1.5 hover:bg-coffee-200 rounded-lg transition-colors"
                                title="แก้ไข"
                              >
                                <Edit className="h-3.5 w-3.5 text-coffee-500" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Empty companies state */}
            {isOrgExpanded && org.companies.length === 0 && (
              <div className="border-t border-purple-200 bg-white p-6 text-center">
                <p className="text-coffee-500 text-sm mb-2">ยังไม่มีบริษัทในองค์กรนี้</p>
                <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  + เพิ่มบริษัทแรก
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
