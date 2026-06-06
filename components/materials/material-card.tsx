'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Video, Link, Play, Download, Clock } from 'lucide-react'
import type { Material } from '@/types'

interface MaterialCardProps {
  material: Material
  onView?: (materialId: string) => void
  onDownload?: (materialId: string) => void
}

export function MaterialCard({ material, onView, onDownload }: MaterialCardProps) {
  const getIcon = () => {
    switch (material.type) {
      case 'pdf':
        return <FileText className="h-5 w-5" />
      case 'video':
        return <Video className="h-5 w-5" />
      case 'link':
        return <Link className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getTypeLabel = () => {
    switch (material.type) {
      case 'pdf':
        return 'PDF'
      case 'video':
        return 'Vídeo'
      case 'link':
        return 'Link'
      case 'interactive':
        return 'Interativo'
      default:
        return material.type
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              {getIcon()}
            </div>
            <Badge variant="outline">{getTypeLabel()}</Badge>
          </div>
          {material.module && (
            <Badge variant="secondary">{material.module}</Badge>
          )}
        </div>
        <CardTitle className="line-clamp-2">{material.title}</CardTitle>
        {material.description && (
          <CardDescription className="line-clamp-2">{material.description}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        {material.duration && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{material.duration} min</span>
          </div>
        )}
        {material.file_size && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
            <Download className="h-4 w-4" />
            <span>{(material.file_size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Button 
          className="flex-1" 
          size="sm"
          onClick={() => onView?.(material.id)}
        >
          <Play className="mr-2 h-4 w-4" />
          Visualizar
        </Button>
        {material.file_url && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDownload?.(material.id)}
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
