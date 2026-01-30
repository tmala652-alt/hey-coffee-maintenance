'use client'

import { BookOpen, Clock, Star, Eye, ThumbsUp, ChevronRight } from 'lucide-react'
import type { KnowledgeArticle, KBArticleDifficulty } from '@/types/database.types'
import { clsx } from 'clsx'
import Link from 'next/link'

interface ArticleCardProps {
  article: KnowledgeArticle & {
    category?: { name: string; icon?: string | null } | null
  }
  variant?: 'default' | 'compact' | 'suggestion'
  showCategory?: boolean
}

export default function ArticleCard({
  article,
  variant = 'default',
  showCategory = true,
}: ArticleCardProps) {
  const difficultyColors: Record<KBArticleDifficulty, string> = {
    beginner: 'bg-matcha-100 text-matcha-700',
    intermediate: 'bg-honey-100 text-honey-700',
    advanced: 'bg-cherry-100 text-cherry-700',
  }

  const difficultyLabels: Record<KBArticleDifficulty, string> = {
    beginner: 'เริ่มต้น',
    intermediate: 'ปานกลาง',
    advanced: 'ขั้นสูง',
  }

  if (variant === 'compact') {
    return (
      <Link
        href={`/tech/knowledge/${article.slug}`}
        className="flex items-center gap-3 p-3 rounded-lg border border-coffee-100 hover:border-coffee-200 hover:bg-cream-50 transition-colors group"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-coffee-100 to-coffee-200 rounded-lg flex items-center justify-center flex-shrink-0">
          <BookOpen className="h-5 w-5 text-coffee-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-coffee-900 truncate group-hover:text-coffee-700">
            {article.title}
          </h4>
          <div className="flex items-center gap-2 text-xs text-coffee-500">
            {article.estimated_time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.estimated_time} นาที
              </span>
            )}
            {article.difficulty && (
              <span
                className={clsx(
                  'px-1.5 py-0.5 rounded',
                  difficultyColors[article.difficulty as KBArticleDifficulty]
                )}
              >
                {difficultyLabels[article.difficulty as KBArticleDifficulty]}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-coffee-300 group-hover:text-coffee-500 group-hover:translate-x-1 transition-all" />
      </Link>
    )
  }

  if (variant === 'suggestion') {
    return (
      <Link
        href={`/tech/knowledge/${article.slug}`}
        className="flex items-start gap-3 p-3 bg-matcha-50 rounded-lg border border-matcha-200 hover:bg-matcha-100 transition-colors group"
      >
        <div className="w-8 h-8 bg-matcha-200 rounded-lg flex items-center justify-center flex-shrink-0">
          <BookOpen className="h-4 w-4 text-matcha-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-matcha-600 mb-1">แนะนำสำหรับงานนี้</p>
          <h4 className="text-sm font-medium text-matcha-800 group-hover:text-matcha-900">
            {article.title}
          </h4>
          {article.estimated_time && (
            <p className="text-xs text-matcha-600 mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {article.estimated_time} นาที
            </p>
          )}
        </div>
      </Link>
    )
  }

  // Default variant
  return (
    <Link
      href={`/tech/knowledge/${article.slug}`}
      className="card hover:shadow-lg transition-shadow group"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-coffee-100 to-coffee-200 rounded-xl flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-coffee-600" />
          </div>
          {article.difficulty && (
            <span
              className={clsx(
                'text-xs px-2 py-1 rounded-full',
                difficultyColors[article.difficulty as KBArticleDifficulty]
              )}
            >
              {difficultyLabels[article.difficulty as KBArticleDifficulty]}
            </span>
          )}
        </div>

        {/* Title & Summary */}
        <h3 className="text-lg font-semibold text-coffee-900 group-hover:text-coffee-700 mb-2">
          {article.title}
        </h3>
        {article.summary && (
          <p className="text-sm text-coffee-600 line-clamp-2 mb-3">{article.summary}</p>
        )}

        {/* Category & Tags */}
        {showCategory && article.category && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-cream-100 text-coffee-600 px-2 py-1 rounded-full">
              {article.category.icon} {article.category.name}
            </span>
          </div>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-coffee-50 text-coffee-500 px-2 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer Stats */}
        <div className="flex items-center gap-4 pt-3 border-t border-coffee-100 text-xs text-coffee-500">
          {article.estimated_time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {article.estimated_time} นาที
            </span>
          )}
          {article.views !== null && article.views > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {article.views}
            </span>
          )}
          {article.helpful_count !== null && article.helpful_count > 0 && (
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3.5 w-3.5" />
              {article.helpful_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// Rating component for helpfulness
export function ArticleRating({
  articleId,
  currentRating,
  onRate,
}: {
  articleId: string
  currentRating?: boolean | null
  onRate: (helpful: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-coffee-600">บทความนี้มีประโยชน์ไหม?</span>
      <div className="flex gap-2">
        <button
          onClick={() => onRate(true)}
          className={clsx(
            'flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors',
            currentRating === true
              ? 'bg-matcha-100 border-matcha-300 text-matcha-700'
              : 'border-coffee-200 text-coffee-500 hover:border-matcha-300'
          )}
        >
          <ThumbsUp className="h-4 w-4" />
          <span className="text-sm">ใช่</span>
        </button>
        <button
          onClick={() => onRate(false)}
          className={clsx(
            'flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors',
            currentRating === false
              ? 'bg-cherry-100 border-cherry-300 text-cherry-700'
              : 'border-coffee-200 text-coffee-500 hover:border-cherry-300'
          )}
        >
          <ThumbsUp className="h-4 w-4 rotate-180" />
          <span className="text-sm">ไม่</span>
        </button>
      </div>
    </div>
  )
}
