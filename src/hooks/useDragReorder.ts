'use client'

import { useRef, useState } from 'react'

export type DropEdge = 'above' | 'below' | null

/** Move an element within an array (returns a new array). */
export function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/**
 * Native HTML5 drag-and-drop list reordering.
 *
 * Usage:
 *  - Spread `handleProps` on the drag handle (GripVertical wrapper). Drags can
 *    only start from the handle, so text selection and inputs inside rows keep working.
 *  - Spread `itemProps(index)` on each draggable row/card.
 *  - Use `isDragging(index)` for the semi-transparent dragged style and
 *    `dropEdge(index)` for the gold drop-indicator border ('above' | 'below' | null).
 *
 * Keep the existing up/down arrow buttons as the accessible fallback.
 */
export function useDragReorder(
  onReorder: (fromIndex: number, toIndex: number) => void,
  enabled: boolean = true
) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const handlePressed = useRef(false)

  const reset = () => {
    handlePressed.current = false
    setDragIndex(null)
    setOverIndex(null)
  }

  /** Spread on the drag handle element. */
  const handleProps = {
    onMouseDown: () => {
      handlePressed.current = true
    },
    onMouseUp: () => {
      handlePressed.current = false
    },
  }

  /** Spread on each draggable row/card. */
  const itemProps = (index: number) => ({
    draggable: enabled,
    onDragStart: (e: React.DragEvent) => {
      if (!enabled || !handlePressed.current) {
        // Only allow drags that started on the handle
        e.preventDefault()
        return
      }
      handlePressed.current = false
      e.dataTransfer.effectAllowed = 'move'
      try {
        e.dataTransfer.setData('text/plain', String(index))
      } catch {
        /* no-op */
      }
      setDragIndex(index)
    },
    onDragOver: (e: React.DragEvent) => {
      if (!enabled || dragIndex === null) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setOverIndex(index)
    },
    onDragLeave: (e: React.DragEvent) => {
      // Ignore transitions into child elements of the same row
      if (e.currentTarget.contains(e.relatedTarget as Node)) return
      setOverIndex((prev) => (prev === index ? null : prev))
    },
    onDrop: (e: React.DragEvent) => {
      if (!enabled || dragIndex === null) return
      e.preventDefault()
      if (dragIndex !== index) onReorder(dragIndex, index)
      reset()
    },
    onDragEnd: reset,
  })

  /** Which edge of item `index` should show the drop indicator. */
  const dropEdge = (index: number): DropEdge => {
    if (dragIndex === null || overIndex !== index || dragIndex === index) return null
    return dragIndex > index ? 'above' : 'below'
  }

  const isDragging = (index: number) => dragIndex === index

  return { handleProps, itemProps, dropEdge, isDragging, dragActive: dragIndex !== null }
}
