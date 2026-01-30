import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  Plus,
  Search,
  Folder,
  FileText,
  Eye,
  ThumbsUp,
  Edit,
  MoreHorizontal,
} from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import type { Profile, KnowledgeArticle, KBCategory } from '@/types/database.types'
import { clsx } from 'clsx'

type ArticleWithCategory = KnowledgeArticle & {
  category: { name: string; icon: string | null } | null
  created_by_profile: { name: string } | null
}

export default async function AdminKnowledgeBasePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = (await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()) as { data: Profile | null }

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch categories
  const { data: categories } = (await supabase
    .from('kb_categories')
    .select('*')
    .order('sort_order')) as { data: KBCategory[] | null }

  // Build query for articles
  let articlesQuery = supabase
    .from('knowledge_articles')
    .select(
      `
      *,
      category:kb_categories(name, icon),
      created_by_profile:profiles!knowledge_articles_created_by_fkey(name)
    `
    )
    .order('created_at', { ascending: false })

  // Apply filters
  if (params.status) {
    articlesQuery = articlesQuery.eq('status', params.status)
  }
  if (params.category) {
    articlesQuery = articlesQuery.eq('category_id', params.category)
  }

  const { data: articles } = (await articlesQuery.limit(50)) as {
    data: ArticleWithCategory[] | null
  }

  // Stats
  const { count: totalArticles } = await supabase
    .from('knowledge_articles')
    .select('*', { count: 'exact', head: true })

  const { count: publishedArticles } = await supabase
    .from('knowledge_articles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')

  const { count: draftArticles } = await supabase
    .from('knowledge_articles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'draft')

  const statusColors: Record<string, string> = {
    draft: 'bg-coffee-100 text-coffee-700',
    published: 'bg-matcha-100 text-matcha-700',
    archived: 'bg-cherry-100 text-cherry-700',
  }

  const statusLabels: Record<string, string> = {
    draft: 'ร่าง',
    published: 'เผยแพร่',
    archived: 'เก็บถาวร',
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-coffee-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-matcha-500 to-matcha-700 rounded-xl flex items-center justify-center shadow-lg shadow-matcha-700/30">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            จัดการ Knowledge Base
          </h1>
          <p className="text-coffee-600 mt-1">สร้างและจัดการบทความสำหรับช่าง</p>
        </div>
        <button className="btn-primary">
          <Plus className="h-5 w-5" />
          สร้างบทความใหม่
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-coffee-100 to-coffee-200">
              <FileText className="h-6 w-6 text-coffee-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-coffee-900">{totalArticles || 0}</p>
              <p className="text-sm text-coffee-500">บทความทั้งหมด</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-matcha-100 to-matcha-200">
              <Eye className="h-6 w-6 text-matcha-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-coffee-900">{publishedArticles || 0}</p>
              <p className="text-sm text-coffee-500">เผยแพร่แล้ว</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-honey-100 to-honey-200">
              <Edit className="h-6 w-6 text-honey-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-coffee-900">{draftArticles || 0}</p>
              <p className="text-sm text-coffee-500">ร่าง</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex gap-2">
          <Link
            href="/admin/knowledge-base"
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              !params.status
                ? 'bg-coffee-700 text-white'
                : 'bg-white text-coffee-600 border border-coffee-200 hover:border-coffee-300'
            )}
          >
            ทั้งหมด
          </Link>
          <Link
            href="/admin/knowledge-base?status=published"
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              params.status === 'published'
                ? 'bg-matcha-500 text-white'
                : 'bg-white text-coffee-600 border border-coffee-200 hover:border-coffee-300'
            )}
          >
            เผยแพร่แล้ว
          </Link>
          <Link
            href="/admin/knowledge-base?status=draft"
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              params.status === 'draft'
                ? 'bg-honey-500 text-white'
                : 'bg-white text-coffee-600 border border-coffee-200 hover:border-coffee-300'
            )}
          >
            ร่าง
          </Link>
        </div>
      </div>

      {/* Articles Table */}
      <div className="card-glass overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-coffee-100 bg-cream-50">
              <th className="text-left px-4 py-3 text-sm font-medium text-coffee-600">
                บทความ
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-coffee-600">
                หมวดหมู่
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-coffee-600">
                สถานะ
              </th>
              <th className="text-center px-4 py-3 text-sm font-medium text-coffee-600">
                เข้าชม
              </th>
              <th className="text-center px-4 py-3 text-sm font-medium text-coffee-600">
                มีประโยชน์
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-coffee-600">
                สร้างโดย
              </th>
              <th className="text-right px-4 py-3 text-sm font-medium text-coffee-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-coffee-100">
            {articles?.map((article) => (
              <tr key={article.id} className="hover:bg-cream-50 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-coffee-900">{article.title}</p>
                    {article.summary && (
                      <p className="text-sm text-coffee-500 truncate max-w-md">
                        {article.summary}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {article.category ? (
                    <span className="text-sm text-coffee-600 flex items-center gap-1">
                      {article.category.icon} {article.category.name}
                    </span>
                  ) : (
                    <span className="text-sm text-coffee-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      'text-xs px-2 py-1 rounded-full',
                      statusColors[article.status || 'draft']
                    )}
                  >
                    {statusLabels[article.status || 'draft']}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm text-coffee-600 flex items-center justify-center gap-1">
                    <Eye className="h-4 w-4" />
                    {article.views || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm text-coffee-600 flex items-center justify-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    {article.helpful_count || 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">
                    <p className="text-coffee-700">
                      {article.created_by_profile?.name || '-'}
                    </p>
                    <p className="text-coffee-400">
                      {format(new Date(article.created_at!), 'd MMM yyyy', {
                        locale: th,
                      })}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="p-2 hover:bg-coffee-100 rounded-lg transition-colors">
                    <MoreHorizontal className="h-5 w-5 text-coffee-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!articles || articles.length === 0) && (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-coffee-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-coffee-400" />
            </div>
            <h3 className="text-lg font-semibold text-coffee-900 mb-2">ไม่มีบทความ</h3>
            <p className="text-coffee-500">คลิก "สร้างบทความใหม่" เพื่อเริ่มต้น</p>
          </div>
        )}
      </div>
    </div>
  )
}
