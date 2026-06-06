'use client'

import { MaterialCard } from './material-card'
import type { Material } from '@/types'

interface MaterialListProps {
  materials: Material[]
  onView?: (materialId: string) => void
  onDownload?: (materialId: string) => void
  emptyMessage?: string
}

export function MaterialList({
  materials,
  onView,
  onDownload,
  emptyMessage = 'Nenhum material encontrado'
}: MaterialListProps) {
  if (materials.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📄</span>
        </div>
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {materials.map((material) => (
        <MaterialCard
          key={material.id}
          material={material}
          onView={onView}
          onDownload={onDownload}
        />
      ))}
    </div>
  )
}
