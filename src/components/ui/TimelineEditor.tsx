'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { VideoSegment } from '@/types'

interface TimelineEditorProps {
  segments: VideoSegment[]
  videoDuration: number
  currentTime?: number
  onSegmentUpdate: (segmentId: string, updates: Partial<VideoSegment>) => void
  onSegmentDelete: (segmentId: string) => void
  onSegmentCreate: (segment: Partial<VideoSegment>) => void
  onTimeUpdate?: (time: number) => void
}

interface DragState {
  isDragging: boolean
  dragType: 'move' | 'resize-start' | 'resize-end' | null
  segmentId: string | null
  startX: number
  originalStartTime: number
  originalEndTime: number
}

export function TimelineEditor({
  segments,
  videoDuration,
  currentTime = 0,
  onSegmentUpdate,
  onSegmentDelete,
  onSegmentCreate,
  onTimeUpdate
}: TimelineEditorProps) {
  const [selectedSegments, setSelectedSegments] = useState<Set<string>>(new Set())
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    segmentId: null,
    startX: 0,
    originalStartTime: 0,
    originalEndTime: 0
  })
  const [zoomLevel, setZoomLevel] = useState(1)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [copiedSegment, setCopiedSegment] = useState<VideoSegment | null>(null)
  const [contextMenu, setContextMenu] = useState<{ segmentId: string, x: number, y: number } | null>(null)
  
  const timelineRef = useRef<HTMLDivElement>(null)
  const TIMELINE_WIDTH = 480 // Fixed width for calculations

  // Convert time to pixel position
  const timeToPixel = useCallback((time: number) => {
    return (time / videoDuration) * TIMELINE_WIDTH * zoomLevel
  }, [videoDuration, zoomLevel])

  // Convert pixel position to time
  const pixelToTime = useCallback((pixel: number) => {
    const time = (pixel / (TIMELINE_WIDTH * zoomLevel)) * videoDuration
    return snapToGrid ? Math.round(time / 5) * 5 : time
  }, [videoDuration, zoomLevel, snapToGrid])

  // Handle timeline click for playhead positioning
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (dragState.isDragging) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = pixelToTime(clickX)
    
    onTimeUpdate?.(Math.max(0, Math.min(newTime, videoDuration)))
  }, [dragState.isDragging, pixelToTime, videoDuration, onTimeUpdate])

  // Handle segment selection
  const handleSegmentClick = useCallback((e: React.MouseEvent, segmentId: string) => {
    e.stopPropagation()
    
    if (e.ctrlKey || e.metaKey) {
      setSelectedSegments(prev => {
        const newSet = new Set(prev)
        if (newSet.has(segmentId)) {
          newSet.delete(segmentId)
        } else {
          newSet.add(segmentId)
        }
        return newSet
      })
    } else {
      setSelectedSegments(new Set([segmentId]))
    }
  }, [])

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent, segmentId: string, dragType: 'move' | 'resize-start' | 'resize-end') => {
    e.preventDefault()
    const segment = segments.find(s => s.id === segmentId)
    if (!segment) return

    setDragState({
      isDragging: true,
      dragType,
      segmentId,
      startX: e.clientX,
      originalStartTime: segment.start_time,
      originalEndTime: segment.end_time
    })
  }, [segments])

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.segmentId) return

    const deltaX = e.clientX - dragState.startX
    const deltaTime = pixelToTime(deltaX) - pixelToTime(0)

    const segment = segments.find(s => s.id === dragState.segmentId)
    if (!segment) return

    if (dragState.dragType === 'move') {
      // Handle multi-segment movement
      if (selectedSegments.has(dragState.segmentId) && selectedSegments.size > 1) {
        // Move all selected segments
        selectedSegments.forEach(segmentId => {
          const seg = segments.find(s => s.id === segmentId)
          if (!seg) return

          const newStartTime = Math.max(0, seg.start_time + deltaTime)
          const duration = seg.end_time - seg.start_time
          const newEndTime = Math.min(videoDuration, newStartTime + duration)

          onSegmentUpdate(segmentId, {
            start_time: newStartTime,
            end_time: newEndTime
          })
        })
      } else {
        // Move single segment
        const newStartTime = Math.max(0, dragState.originalStartTime + deltaTime)
        const duration = dragState.originalEndTime - dragState.originalStartTime
        const newEndTime = Math.min(videoDuration, newStartTime + duration)

        onSegmentUpdate(dragState.segmentId, {
          start_time: newStartTime,
          end_time: newEndTime
        })
      }
    } else {
      // Handle resize operations (only for single segments)
      let newStartTime = dragState.originalStartTime
      let newEndTime = dragState.originalEndTime

      switch (dragState.dragType) {
        case 'resize-start':
          newStartTime = Math.max(0, Math.min(dragState.originalStartTime + deltaTime, dragState.originalEndTime - 1))
          break

        case 'resize-end':
          newEndTime = Math.min(videoDuration, Math.max(dragState.originalEndTime + deltaTime, dragState.originalStartTime + 1))
          break
      }

      onSegmentUpdate(dragState.segmentId, {
        start_time: newStartTime,
        end_time: newEndTime
      })
    }
  }, [dragState, segments, pixelToTime, videoDuration, onSegmentUpdate, selectedSegments])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      dragType: null,
      segmentId: null,
      startX: 0,
      originalStartTime: 0,
      originalEndTime: 0
    })
  }, [])

  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent, segmentId: string) => {
    e.preventDefault()
    const segment = segments.find(s => s.id === segmentId)
    if (!segment) return

    setContextMenu({
      segmentId,
      x: e.clientX,
      y: e.clientY
    })
  }, [segments])

  // Handle segment splitting
  const handleSplitSegment = useCallback((segmentId: string) => {
    const segment = segments.find(s => s.id === segmentId)
    if (!segment) return

    const midTime = (segment.start_time + segment.end_time) / 2
    
    // Update original segment
    onSegmentUpdate(segmentId, {
      end_time: midTime
    })

    // Create new segment
    onSegmentCreate({
      video_upload_id: segment.video_upload_id,
      start_time: midTime,
      end_time: segment.end_time,
      title: segment.title,
      description: segment.description,
      content_type: segment.content_type,
      engagement_score: segment.engagement_score,
      transcript_segment: segment.transcript_segment,
      visual_cues: segment.visual_cues,
      audio_features: segment.audio_features,
      platform_optimizations: segment.platform_optimizations,
      status: 'extracted'
    })

    setContextMenu(null)
  }, [segments, onSegmentUpdate, onSegmentCreate])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedSegments.size > 0) {
        selectedSegments.forEach(segmentId => {
          onSegmentDelete(segmentId)
        })
        setSelectedSegments(new Set())
      }

      if (e.key === 'c' && (e.ctrlKey || e.metaKey) && selectedSegments.size === 1) {
        const segmentId = Array.from(selectedSegments)[0]
        const segment = segments.find(s => s.id === segmentId)
        if (segment) {
          setCopiedSegment(segment)
        }
      }

      if (e.key === 'v' && (e.ctrlKey || e.metaKey) && copiedSegment) {
        onSegmentCreate({
          ...copiedSegment,
          title: `${copiedSegment.title} (Copy)`,
          start_time: copiedSegment.end_time,
          end_time: copiedSegment.end_time + (copiedSegment.end_time - copiedSegment.start_time)
        })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedSegments, segments, copiedSegment, onSegmentDelete, onSegmentCreate])

  // Mouse event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className="timeline-editor">
      {/* Timeline Controls */}
      <div className="flex items-center gap-2 mb-4">
        <button
          data-testid="zoom-in-button"
          onClick={() => setZoomLevel(prev => Math.min(prev * 1.5, 4))}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Zoom In
        </button>
        <button
          data-testid="zoom-out-button"
          onClick={() => setZoomLevel(prev => Math.max(prev / 1.5, 0.25))}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Zoom Out
        </button>
        <button
          data-testid="snap-to-grid-button"
          onClick={() => setSnapToGrid(prev => !prev)}
          className={`px-3 py-1 rounded ${snapToGrid ? 'bg-green-500 text-white active' : 'bg-gray-200 text-gray-700'}`}
        >
          Snap to Grid
        </button>
      </div>

      {/* Timeline Container */}
      <div 
        ref={timelineRef}
        data-testid="timeline-container"
        className={`relative bg-gray-100 border border-gray-300 rounded overflow-x-auto ${
          zoomLevel > 1 ? 'zoomed-in' : zoomLevel < 1 ? 'zoomed-out' : ''
        }`}
        style={{ width: `${TIMELINE_WIDTH}px`, height: '200px' }}
      >
        {/* Timeline Ruler */}
        <div 
          data-testid="timeline-ruler"
          className="absolute top-0 left-0 w-full h-8 bg-gray-200 border-b border-gray-300 cursor-pointer"
          onClick={handleTimelineClick}
          style={{ width: `${TIMELINE_WIDTH * zoomLevel}px` }}
        >
          {/* Time markers */}
          {Array.from({ length: Math.ceil(videoDuration / 10) + 1 }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-gray-400 text-xs text-gray-600 pl-1"
              style={{ left: `${timeToPixel(i * 10)}px` }}
            >
              {i * 10}s
            </div>
          ))}
        </div>

        {/* Playhead */}
        <div
          data-testid="timeline-playhead"
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
          style={{ left: `${timeToPixel(currentTime)}px` }}
        />

        {/* Segments */}
        {segments.map(segment => {
          const duration = segment.end_time - segment.start_time
          const left = timeToPixel(segment.start_time)
          const width = timeToPixel(duration)
          const isSelected = selectedSegments.has(segment.id)

          return (
            <div key={segment.id} className="absolute top-10" style={{ left: `${left}px` }}>
              {/* Segment block */}
              <div
                data-testid={`segment-${segment.id}`}
                className={`relative h-16 border-2 rounded cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-100 selected' 
                    : 'border-gray-400 bg-white hover:bg-gray-50'
                }`}
                style={{ width: `${width}px` }}
                onClick={(e) => handleSegmentClick(e, segment.id)}
                onMouseDown={(e) => handleMouseDown(e, segment.id, 'move')}
                onContextMenu={(e) => handleContextMenu(e, segment.id)}
              >
                {/* Segment content */}
                <div className="p-2 text-xs">
                  <div className="font-medium truncate">{segment.title}</div>
                  <div className="text-gray-500">{Math.round(duration)}s</div>
                </div>

                {/* Resize handles */}
                <div
                  data-testid={`segment-${segment.id}-start-handle`}
                  className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 cursor-ew-resize opacity-0 hover:opacity-100"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    handleMouseDown(e, segment.id, 'resize-start')
                  }}
                />
                <div
                  data-testid={`segment-${segment.id}-end-handle`}
                  className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500 cursor-ew-resize opacity-0 hover:opacity-100"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    handleMouseDown(e, segment.id, 'resize-end')
                  }}
                />

                {/* Delete button */}
                <button
                  data-testid={`delete-segment-${segment.id}`}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSegmentDelete(segment.id)
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          )
        })}

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="absolute bg-white border border-gray-300 rounded shadow-lg py-1 z-30"
            style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          >
            <button
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              onClick={() => {
                const segment = segments.find(s => s.id === contextMenu.segmentId)
                if (segment) {
                  handleSplitSegment(contextMenu.segmentId)
                }
              }}
            >
              {(() => {
                const segment = segments.find(s => s.id === contextMenu.segmentId)
                const midTime = segment ? Math.round((segment.start_time + segment.end_time) / 2) : 0
                return `Split at ${midTime}s`
              })()}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}