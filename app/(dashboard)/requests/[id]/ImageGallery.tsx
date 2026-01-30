'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { Attachment } from '@/types/database.types'

interface ImageGalleryProps {
  images: Attachment[]
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
  }

  const closeLightbox = () => {
    setSelectedIndex(null)
  }

  const goNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % images.length)
    }
  }

  const goPrev = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + images.length) % images.length)
    }
  }

  const isVideo = (item: Attachment) => item.type === 'video'

  return (
    <>
      {/* Thumbnails */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {images.map((item, index) => (
          <button
            key={item.id}
            onClick={() => openLightbox(index)}
            className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-coffee-500 transition-all relative"
          >
            {isVideo(item) ? (
              <>
                <video
                  src={item.file_url}
                  className="w-full h-full object-cover"
                  muted
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                    <Play className="h-5 w-5 text-purple-600 ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-purple-600 rounded text-white text-xs font-medium">
                  วิดีโอ
                </div>
              </>
            ) : (
              <img
                src={item.file_url}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-10"
          >
            <X className="h-8 w-8" />
          </button>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goPrev()
                }}
                className="absolute left-4 p-2 text-white/80 hover:text-white z-10"
              >
                <ChevronLeft className="h-10 w-10" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goNext()
                }}
                className="absolute right-4 p-2 text-white/80 hover:text-white z-10"
              >
                <ChevronRight className="h-10 w-10" />
              </button>
            </>
          )}

          {/* Image or Video */}
          {isVideo(images[selectedIndex]) ? (
            <video
              src={images[selectedIndex].file_url}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
              controls
              autoPlay
            />
          ) : (
            <img
              src={images[selectedIndex].file_url}
              alt=""
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  )
}
