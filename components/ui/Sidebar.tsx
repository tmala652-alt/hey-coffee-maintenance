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
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database.types'
import { clsx } from 'clsx'
import { useState } from 'react'
import NotificationBell from './NotificationBell'

interface SidebarProps {
  profile: Profile | null
}

const roleIcons = {
  admin: Crown,
  branch: Store,
  technician: HardHat,
  vendor: Truck,
}

const roleTitles = {
  admin: 'ผู้ดูแลระบบ',
  branch: 'พนักงานสาขา',
  technician: 'ช่างเทคนิค',
  vendor: 'ผู้รับเหมา',
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
  const isTechnician = profile?.role === 'technician'

  const mainNavigation = [
    {
      name: 'แดชบอร์ด',
      href: '/dashboard',
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
      show: !isTechnician,
    },
    {
      name: 'งานของฉัน',
      href: '/tech/jobs',
      icon: Briefcase,
      show: isTechnician,
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
      name: 'รายงาน',
      href: '/admin/reports',
      icon: FileText,
      show: isAdmin,
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
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          collapsed && !isMobile ? 'justify-center' : '',
          isActive
            ? 'bg-coffee-700 text-white'
            : 'text-coffee-600 hover:bg-coffee-50 hover:text-coffee-900'
        )}
        title={collapsed && !isMobile ? item.name : undefined}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        {(!collapsed || isMobile) && <span>{item.name}</span>}
      </Link>
    )
  }

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className={clsx(
        "flex items-center gap-3 border-b border-coffee-100",
        collapsed && !isMobile ? "px-4 h-16 justify-center" : "px-5 h-16"
      )}>
        <div className="w-10 h-10 bg-gradient-to-br from-coffee-600 to-coffee-800 rounded-xl flex items-center justify-center flex-shrink-0">
          <Coffee className="h-5 w-5 text-white" />
        </div>
        {(!collapsed || isMobile) && (
          <div>
            <span className="text-base font-bold text-coffee-900 block">Hey! Coffee</span>
            <span className="text-xs text-coffee-500">Maintenance</span>
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
              <div className="pt-4 pb-2">
                <div className="flex items-center gap-2 px-3 text-xs font-semibold text-coffee-400 uppercase tracking-wider">
                  <Shield className="h-3.5 w-3.5" />
                  <span>ผู้ดูแลระบบ</span>
                </div>
              </div>
            )}
            {collapsed && !isMobile && (
              <div className="py-2">
                <div className="border-t border-coffee-200 mx-2" />
              </div>
            )}
            {filteredAdminNav.map((item) => (
              <NavItem key={item.href} item={item} isMobile={isMobile} />
            ))}
          </>
        )}

      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-coffee-100">
        {(!collapsed || isMobile) && profile && (
          <div className="mb-3 p-2.5 bg-cream-50 rounded-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-coffee-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <RoleIcon className="h-4 w-4 text-coffee-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-coffee-900 truncate">
                  {profile.name}
                </p>
                <p className="text-xs text-coffee-500">
                  {roleTitles[profile.role as keyof typeof roleTitles] || profile.role}
                </p>
              </div>
              <NotificationBell userId={profile.id} />
            </div>
          </div>
        )}
        {collapsed && !isMobile && profile && (
          <div className="mb-2 flex justify-center">
            <NotificationBell userId={profile.id} />
          </div>
        )}
        {/* Settings Link */}
        <Link
          href="/settings"
          onClick={() => setMobileOpen(false)}
          className={clsx(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1",
            collapsed && !isMobile ? "justify-center" : "",
            pathname === '/settings'
              ? "bg-coffee-700 text-white"
              : "text-coffee-600 hover:bg-coffee-50 hover:text-coffee-900"
          )}
          title={collapsed && !isMobile ? "จัดการข้อมูล" : undefined}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {(!collapsed || isMobile) && <span>จัดการข้อมูล</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={clsx(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-coffee-600 hover:bg-cherry-50 hover:text-cherry-600 w-full transition-colors",
            collapsed && !isMobile && "justify-center"
          )}
          title={collapsed && !isMobile ? "ออกจากระบบ" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
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
