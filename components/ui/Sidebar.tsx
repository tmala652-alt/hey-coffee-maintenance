'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Coffee,
  LayoutDashboard,
  Wrench,
  Plus,
  Users,
  Building2,
  FileText,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Briefcase,
  Crown,
  Store,
  HardHat,
  Truck,
  Settings,
  Shield,
  Package,
  Calendar,
  Receipt,
  Wallet,
  Sparkles,
  BookOpen,
  GitBranch,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database.types'
import { clsx } from 'clsx'
import { useState } from 'react'

interface SidebarProps {
  profile: Profile | null
}

const roleIcons = {
  admin: Crown,
  branch: Store,
  technician: HardHat,
  vendor: Truck,
  manager: Shield,
}

const roleTitles = {
  admin: 'ผู้ดูแลระบบ',
  branch: 'พนักงานสาขา',
  technician: 'ช่างเทคนิค',
  vendor: 'ผู้รับเหมา',
  manager: 'ผู้จัดการ',
}

const roleColors = {
  admin: 'from-purple-500 to-purple-600',
  branch: 'from-blue-500 to-blue-600',
  technician: 'from-orange-500 to-orange-600',
  vendor: 'from-emerald-500 to-emerald-600',
  manager: 'from-indigo-500 to-indigo-600',
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isAdmin = profile?.role === 'admin'
  const isManager = profile?.role === 'manager'
  const isTechnician = profile?.role === 'technician'
  const isBranch = profile?.role === 'branch'

  const mainNavigation = [
    {
      name: 'แดชบอร์ด',
      href: isManager ? '/manager' : isBranch ? '/branch' : '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: 'งานแจ้งซ่อม',
      href: '/requests',
      icon: Wrench,
      show: true,
    },
    {
      name: 'แจ้งซ่อมใหม่',
      href: '/requests/new',
      icon: Plus,
      show: !isTechnician && !isManager,
    },
    {
      name: 'งานของฉัน',
      href: '/tech/jobs',
      icon: Briefcase,
      show: isTechnician,
    },
    {
      name: 'ทีมงาน',
      href: '/manager',
      icon: Users,
      show: isManager,
    },
  ]

  const adminNavigation = [
    {
      name: 'จัดการสาขา',
      href: '/admin/branches',
      icon: Building2,
      show: isAdmin,
    },
    {
      name: 'จัดการผู้ใช้',
      href: '/admin/users',
      icon: Users,
      show: isAdmin,
    },
    {
      name: 'ผู้รับเหมา',
      href: '/admin/vendors',
      icon: Truck,
      show: isAdmin,
    },
    {
      name: 'อุปกรณ์',
      href: '/admin/equipment',
      icon: Package,
      show: isAdmin,
    },
    {
      name: 'ตารางบำรุงรักษา',
      href: '/admin/schedules',
      icon: Calendar,
      show: isAdmin,
    },
    {
      name: 'ค่าใช้จ่าย',
      href: '/admin/expenses',
      icon: Receipt,
      show: isAdmin || isManager,
    },
    {
      name: 'ใบเบิกเงิน',
      href: '/admin/disbursements',
      icon: Wallet,
      show: isAdmin,
    },
    {
      name: 'รายงาน',
      href: '/admin/reports',
      icon: FileText,
      show: isAdmin || isManager,
    },
    {
      name: 'ตั้งค่าระบบ',
      href: '/admin/settings',
      icon: Shield,
      show: isAdmin,
    },
  ]

  const filteredMainNav = mainNavigation.filter((item) => item.show)
  const filteredAdminNav = adminNavigation.filter((item) => item.show)

  const RoleIcon = profile?.role ? roleIcons[profile.role as keyof typeof roleIcons] : Store

  const NavItem = ({ item, isMobile = false }: { item: typeof mainNavigation[0]; isMobile?: boolean }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={clsx(
          'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
          collapsed && !isMobile ? 'justify-center' : '',
          isActive
            ? 'bg-gradient-to-r from-coffee-700 to-coffee-800 text-white shadow-lg shadow-coffee-700/25'
            : 'text-coffee-600 hover:bg-gradient-to-r hover:from-coffee-50 hover:to-cream-50 hover:text-coffee-900 hover:translate-x-1'
        )}
        title={collapsed && !isMobile ? item.name : undefined}
      >
        <div className={clsx(
          'flex items-center justify-center transition-all duration-300',
          isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-3'
        )}>
          <item.icon className="h-5 w-5 flex-shrink-0" />
        </div>
        {(!collapsed || isMobile) && (
          <span className="transition-all duration-200">{item.name}</span>
        )}
        {isActive && (!collapsed || isMobile) && (
          <Sparkles className="h-3 w-3 ml-auto opacity-60 animate-sparkle" />
        )}
      </Link>
    )
  }

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-cream-50/50">
      {/* Logo */}
      <div className={clsx(
        "flex items-center gap-3 border-b border-coffee-100/50",
        collapsed && !isMobile ? "px-4 h-16 justify-center" : "px-5 h-16"
      )}>
        <div className="relative group">
          <div className="w-10 h-10 bg-gradient-to-br from-coffee-600 via-coffee-700 to-coffee-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-coffee-700/30 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-coffee-700/40 group-hover:scale-105">
            <Coffee className="h-5 w-5 text-white transition-transform duration-300 group-hover:rotate-12" />
          </div>
          <div className="absolute -inset-1 bg-gradient-to-r from-honey-400 to-coffee-500 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />
        </div>
        {(!collapsed || isMobile) && (
          <div className="animate-fade-in">
            <span className="text-base font-bold bg-gradient-to-r from-coffee-800 to-coffee-600 bg-clip-text text-transparent block">Hey! Coffee</span>
            <span className="text-xs text-coffee-500 flex items-center gap-1">
              <Wrench className="h-3 w-3" />
              Maintenance
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Main Navigation */}
        {filteredMainNav.map((item) => (
          <NavItem key={item.href} item={item} isMobile={isMobile} />
        ))}

        {/* Admin Section */}
        {filteredAdminNav.length > 0 && (
          <>
            {(!collapsed || isMobile) && (
              <div className="pt-5 pb-2">
                <div className="flex items-center gap-2 px-3 text-xs font-semibold text-coffee-400 uppercase tracking-wider">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                    <Shield className="h-3 w-3 text-purple-600" />
                  </div>
                  <span>ผู้ดูแลระบบ</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-coffee-200 to-transparent ml-2" />
                </div>
              </div>
            )}
            {collapsed && !isMobile && (
              <div className="py-3">
                <div className="border-t border-gradient-to-r from-coffee-200 to-transparent mx-2" />
              </div>
            )}
            {filteredAdminNav.map((item) => (
              <NavItem key={item.href} item={item} isMobile={isMobile} />
            ))}
          </>
        )}

      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-coffee-100/50 bg-white/50">
        {(!collapsed || isMobile) && profile && (
          <div className="mb-3 p-3 bg-gradient-to-br from-cream-50 to-white rounded-xl border border-coffee-100/50 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <div className={clsx(
                "relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br shadow-md transition-all duration-300 hover:scale-105",
                roleColors[profile.role as keyof typeof roleColors] || 'from-coffee-500 to-coffee-600'
              )}>
                <RoleIcon className="h-5 w-5 text-white" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-matcha-500 rounded-full border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-coffee-900 truncate">
                  {profile.name}
                </p>
                <p className="text-xs text-coffee-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-matcha-500 animate-pulse" />
                  {roleTitles[profile.role as keyof typeof roleTitles] || profile.role}
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Settings Link */}
        <Link
          href="/settings"
          onClick={() => setMobileOpen(false)}
          className={clsx(
            "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 mb-1",
            collapsed && !isMobile ? "justify-center" : "",
            pathname === '/settings'
              ? "bg-gradient-to-r from-coffee-700 to-coffee-800 text-white shadow-lg shadow-coffee-700/25"
              : "text-coffee-600 hover:bg-gradient-to-r hover:from-coffee-50 hover:to-cream-50 hover:text-coffee-900"
          )}
          title={collapsed && !isMobile ? "จัดการข้อมูล" : undefined}
        >
          <Settings className={clsx(
            "h-5 w-5 flex-shrink-0 transition-transform duration-300",
            pathname !== '/settings' && "group-hover:rotate-90"
          )} />
          {(!collapsed || isMobile) && <span>จัดการข้อมูล</span>}
        </Link>
        {/* Help Link */}
        <Link
          href="/help"
          onClick={() => setMobileOpen(false)}
          className={clsx(
            "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 mb-1",
            collapsed && !isMobile ? "justify-center" : "",
            pathname === '/help'
              ? "bg-gradient-to-r from-coffee-700 to-coffee-800 text-white shadow-lg shadow-coffee-700/25"
              : "text-coffee-600 hover:bg-gradient-to-r hover:from-coffee-50 hover:to-cream-50 hover:text-coffee-900"
          )}
          title={collapsed && !isMobile ? "คู่มือการใช้งาน" : undefined}
        >
          <BookOpen className={clsx(
            "h-5 w-5 flex-shrink-0 transition-transform duration-300",
            pathname !== '/help' && "group-hover:scale-110"
          )} />
          {(!collapsed || isMobile) && <span>คู่มือการใช้งาน</span>}
        </Link>
        {/* Workflow Link */}
        <Link
          href="/workflow"
          onClick={() => setMobileOpen(false)}
          className={clsx(
            "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 mb-1",
            collapsed && !isMobile ? "justify-center" : "",
            pathname === '/workflow'
              ? "bg-gradient-to-r from-coffee-700 to-coffee-800 text-white shadow-lg shadow-coffee-700/25"
              : "text-coffee-600 hover:bg-gradient-to-r hover:from-coffee-50 hover:to-cream-50 hover:text-coffee-900"
          )}
          title={collapsed && !isMobile ? "Workflow ระบบ" : undefined}
        >
          <GitBranch className={clsx(
            "h-5 w-5 flex-shrink-0 transition-transform duration-300",
            pathname !== '/workflow' && "group-hover:scale-110"
          )} />
          {(!collapsed || isMobile) && <span>Workflow ระบบ</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={clsx(
            "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-coffee-600 hover:bg-gradient-to-r hover:from-cherry-50 hover:to-red-50 hover:text-cherry-600 w-full transition-all duration-300",
            collapsed && !isMobile && "justify-center"
          )}
          title={collapsed && !isMobile ? "ออกจากระบบ" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:-translate-x-1" />
          {(!collapsed || isMobile) && <span>ออกจากระบบ</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-lg shadow-md border border-coffee-100"
      >
        <Menu className="h-5 w-5 text-coffee-700" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={clsx(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl flex flex-col transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-3 p-1.5 text-coffee-400 hover:text-coffee-600 rounded"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent isMobile />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          'hidden lg:flex fixed inset-y-0 left-0 z-30 bg-white border-r border-coffee-100 flex-col transition-all duration-200',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        <SidebarContent />
        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-coffee-200 rounded-full flex items-center justify-center text-coffee-400 hover:text-coffee-600 shadow-sm"
        >
          <ChevronLeft className={clsx('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </aside>
    </>
  )
}
