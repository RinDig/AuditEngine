'use client'

import { useState } from 'react'
import { Button, Input, Modal } from '@/components/ui'
import type { Scale } from '@/lib/types'
import { validateCustomScale, type CustomScaleItem } from '@/lib/api'
import { cn } from '@/lib/utils'

interface ItemInput extends CustomScaleItem {
  key: string // For React keys
}

interface CustomScaleModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (scale: Scale) => void
  existingScaleNames: string[]
}

export function CustomScaleModal({
  isOpen,
  onClose,
  onAdd,
  existingScaleNames,
}: CustomScaleModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [citation, setCitation] = useState('')
  const [scaleMin, setScaleMin] = useState(1)
  const [scaleMax, setScaleMax] = useState(5)
  const [items, setItems] = useState<ItemInput[]>([
    { key: '1', id: '1', text: '', reverse_score: false },
  ])
  const [validating, setValidating] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const addItem = () => {
    const nextNum = items.length + 1
    setItems([...items, { key: String(nextNum), id: String(nextNum), text: '', reverse_score: false }])
  }

  const removeItem = (key: string) => {
    if (items.length <= 1) return
    setItems(items.filter((item) => item.key !== key))
  }

  const updateItem = (key: string, field: keyof CustomScaleItem, value: string | boolean) => {
    setItems(items.map((item) =>
      item.key === key ? { ...item, [field]: value } : item
    ))
  }

  const handleSubmit = async () => {
    // Client-side validation
    const clientErrors: string[] = []

    if (!name.trim()) {
      clientErrors.push('Scale name is required')
    }
    if (existingScaleNames.includes(name.trim())) {
      clientErrors.push('Scale name already exists')
    }
    if (scaleMin >= scaleMax) {
      clientErrors.push('Scale minimum must be less than maximum')
    }
    const validItems = items.filter((item) => item.text.trim())
    if (validItems.length === 0) {
      clientErrors.push('At least one item with text is required')
    }
    const itemIds = validItems.map((item) => item.id)
    if (itemIds.length !== new Set(itemIds).size) {
      clientErrors.push('All item IDs must be unique')
    }

    if (clientErrors.length > 0) {
      setErrors(clientErrors)
      return
    }

    setValidating(true)
    setErrors([])

    try {
      const response = await validateCustomScale({
        name: name.trim(),
        description: description.trim() || undefined,
        citation: citation.trim() || undefined,
        scale_min: scaleMin,
        scale_max: scaleMax,
        items: validItems.map((item) => ({
          id: item.id,
          text: item.text.trim(),
          reverse_score: item.reverse_score,
        })),
      })

      if (!response.valid) {
        setErrors(response.errors)
        return
      }

      if (response.scale) {
        onAdd(response.scale)
        handleClose()
      }
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to validate scale'])
    } finally {
      setValidating(false)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setCitation('')
    setScaleMin(1)
    setScaleMax(5)
    setItems([{ key: '1', id: '1', text: '', reverse_score: false }])
    setErrors([])
    onClose()
  }

  const validItemCount = items.filter((item) => item.text.trim()).length

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Custom Scale"
      description="Create a custom psychometric scale for your assessment"
      size="xl"
    >
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
        {/* Basic Info Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">1</span>
            Basic Information
          </h4>

          <Input
            label="Scale Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., My Custom Scale"
            hint="A unique name for your scale"
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">
              Description <span className="text-text-tertiary">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this scale measures..."
              className="input-base min-h-[60px] resize-none"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">
              Citation <span className="text-text-tertiary">(optional)</span>
            </label>
            <Input
              value={citation}
              onChange={(e) => setCitation(e.target.value)}
              placeholder="e.g., Author, Year. Paper Title. Journal."
            />
          </div>
        </div>

        {/* Scale Range Section */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">2</span>
            Response Scale
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">
                Minimum Value
              </label>
              <select
                value={scaleMin}
                onChange={(e) => setScaleMin(parseInt(e.target.value))}
                className="input-base"
              >
                {[0, 1].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">
                Maximum Value
              </label>
              <select
                value={scaleMax}
                onChange={(e) => setScaleMax(parseInt(e.target.value))}
                className="input-base"
              >
                {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-text-secondary">
              Response range: <span className="font-semibold">{scaleMin}</span> to <span className="font-semibold">{scaleMax}</span> (Likert scale)
            </p>
          </div>
        </div>

        {/* Items Section */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">3</span>
              Scale Items
            </h4>
            <span className="text-xs text-text-tertiary">
              {validItemCount} item{validItemCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.key}
                className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-tertiary">
                    Item {index + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="p-1 text-text-tertiary hover:text-status-error hover:bg-red-50 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-1">
                    <Input
                      placeholder="ID"
                      value={item.id}
                      onChange={(e) => updateItem(item.key, 'id', e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="col-span-3">
                    <textarea
                      placeholder="Question text..."
                      value={item.text}
                      onChange={(e) => updateItem(item.key, 'text', e.target.value)}
                      className="input-base text-sm resize-none"
                      rows={2}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.reverse_score}
                    onChange={(e) => updateItem(item.key, 'reverse_score', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span className="text-xs text-text-secondary">Reverse scored</span>
                </label>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="w-full p-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-text-tertiary hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors"
          >
            <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Another Item
          </button>
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <h5 className="text-sm font-semibold text-red-800 mb-2">Please fix the following:</h5>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
        <Button variant="ghost" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!name.trim() || validItemCount === 0 || validating}
          loading={validating}
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Scale
        </Button>
      </div>
    </Modal>
  )
}
