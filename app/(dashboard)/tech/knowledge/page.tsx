import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Search, Folder, Star, TrendingUp, Clock } from 'lucide-react'
import ArticleCard from '@/components/knowledge/ArticleCard'
import type { Profile, KnowledgeArticle, KBCategory } from '@/types/database.types'

type ArticleWithCategory = KnowledgeArticle & {
  category: { name: string; icon: string | null } | null
}

type CategoryWithCount = KBCategory & {
  _count?: number
}

export default async function TechKnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
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

  if (profile?.role !== 'technician' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch categories
  const { data: categories } = (await supabase
    .from('kb_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')) as { data: CategoryWithCount[] | null }

  // Build query for articles
  let articlesQuery = supabase
    .from('knowledge_articles')
    .select(
      `
      *,
      category:kb_categories(name, icon)
    `
    )
    .eq('status', 'published')
    .order('helpful_count', { ascending: false })

  // Apply search filter
  if (params.q) {
    articlesQuery = articlesQuery.or(
      `title.ilike.%${params.q}%,summary.ilike.%${params.q}%,content.ilike.%${params.q}%`
    )
  }

  // Apply category filter
  if (params.category) {
    articlesQuery = articlesQuery.eq('category_id', params.category)
  }

  const { data: articles } = (await articlesQuery.limit(20)) as {
    data: ArticleWithCategory[] | null
  }

  // Fetch popular articles (different from search results)
  const { data: popularArticles } = (await supabase
    .from('knowledge_articles')
    .select(
      `
      *,
      category:kb_categories(name, icon)
    `
    )
    .eq('status', 'published')
    .order('helpful_count', { ascending: false })
    .limit(5)) as { data: ArticleWithCategory[] | null }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-coffee-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-matcha-500 to-matcha-700 rounded-xl flex items-center justify-center shadow-lg shadow-matcha-700/30">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          Knowledge Base
        </h1>
        <p className="text-coffee-600 mt-1">
          คู่มือและบทความสำหรับการซ่อมบำรุง
        </p>
      </div>

      {/* Search */}
      <form className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-coffee-400" />
        <input
          type="text"
          name="q"
          defaultValue={params.q}
          placeholder="ค้นหาบทความ..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-coffee-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-matcha-500 focus:border-transparent"
        />
      </form>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar - Categories */}
        <div className="lg:col-span-1 space-y-6">
          {/* Categories */}
          <div className="card-glass p-4">
            <h2 className="font-semibold text-coffee-900 flex items-center gap-2 mb-4">
              <Folder className="h-5 w-5 text-coffee-500" />
              หมวดหมู่
            </h2>
            <nav className="space-y-1">
              <Link
                href="/tech/knowledge"
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  !params.category
                    ? 'bg-matcha-100 text-matcha-700'
                    : 'text-coffee-600 hover:bg-cream-100'
                }`}
              >
                <span>ทั้งหมด</span>
              </Link>
              {categories?.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/tech/knowledge?category=${cat.id}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    params.category === cat.id
                      ? 'bg-matcha-100 text-matcha-700'
                      : 'text-coffee-600 hover:bg-cream-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {cat.icon && <span>{cat.icon}</span>}
                    {cat.name}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Popular Articles */}
          {!params.q && !params.category && popularArticles && popularArticles.length > 0 && (
            <div className="card-glass p-4">
              <h2 className="font-semibold text-coffee-900 flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-honey-500" />
                บทความยอดนิยม
              </h2>
              <div className="space-y-2">
                {popularArticles.slice(0, 5).map((article, idx) => (
                  <Link
                    key={article.id}
                    href={`/tech/knowledge/${article.slug}`}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-cream-100 transition-colors group"
                  >
                    <span className="w-6 h-6 bg-honey-100 text-honey-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-coffee-700 group-hover:text-coffee-900 line-clamp-2">
                        {article.title}
                      </p>
                      {article.helpful_count !== null && article.helpful_count > 0 && (
                        <p className="text-xs text-coffee-400 flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-honey-400 text-honey-400" />
                          {article.helpful_count} คนพบว่ามีประโยชน์
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content - Articles */}
        <div className="lg:col-span-3">
          {/* Search Results Header */}
          {params.q && (
            <div className="mb-4">
              <p className="text-coffee-600">
                ผลการค้นหา "{params.q}" พบ {articles?.length || 0} บทความ
              </p>
            </div>
          )}

          {/* Articles Grid */}
          {articles && articles.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="card-glass">
              <div className="text-center py-16 px-6">
                <div className="w-20 h-20 bg-gradient-to-br from-coffee-100 to-coffee-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-10 w-10 text-coffee-400" />
                </div>
                <h3 className="text-xl font-bold text-coffee-900 mb-2">ไม่พบบทความ</h3>
                <p className="text-coffee-500 max-w-sm mx-auto">
                  {params.q
                    ? `ไม่พบบทความที่ตรงกับ "${params.q}"`
                    : 'ยังไม่มีบทความในหมวดหมู่นี้'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
