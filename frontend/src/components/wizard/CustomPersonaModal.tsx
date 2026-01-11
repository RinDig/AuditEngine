'use client'

import { useState } from 'react'
import { Button, Input, Modal } from '@/components/ui'
import type { Persona } from '@/lib/types'

interface CustomPersonaModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (persona: Persona) => void
  existingIds: string[]
}

export function CustomPersonaModal({
  isOpen,
  onClose,
  onAdd,
  existingIds,
}: CustomPersonaModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [promptPrefix, setPromptPrefix] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const generateId = (name: string): string => {
    const baseId = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')

    // Ensure unique ID
    let id = `custom_${baseId}`
    let counter = 1
    while (existingIds.includes(id)) {
      id = `custom_${baseId}_${counter}`
      counter++
    }
    return id
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Name is required'
    } else if (name.length > 50) {
      newErrors.name = 'Name must be 50 characters or less'
    }

    if (!promptPrefix.trim()) {
      newErrors.promptPrefix = 'Prompt prefix is required'
    } else if (promptPrefix.length > 500) {
      newErrors.promptPrefix = 'Prompt prefix must be 500 characters or less'
    }

    if (description.length > 200) {
      newErrors.description = 'Description must be 200 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    const persona: Persona = {
      id: generateId(name),
      name: name.trim(),
      description: description.trim() || undefined,
      prompt_prefix: promptPrefix.trim(),
    }

    onAdd(persona)
    handleClose()
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setPromptPrefix('')
    setErrors({})
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Custom Persona"
      description="Create a custom ideological framing for your assessment"
      size="lg"
    >
      <div className="space-y-5">
        {/* Name Input */}
        <Input
          label="Persona Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Skeptical Scientist"
          error={errors.name}
          hint="A short, descriptive name for this persona"
        />

        {/* Description Input */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-primary">
            Description <span className="text-text-tertiary">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this persona's perspective..."
            className="input-base min-h-[80px] resize-none"
            rows={2}
          />
          {errors.description ? (
            <p className="text-xs text-status-error">{errors.description}</p>
          ) : (
            <p className="text-xs text-text-tertiary">{description.length}/200 characters</p>
          )}
        </div>

        {/* Prompt Prefix Input */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-primary">
            Prompt Prefix
          </label>
          <textarea
            value={promptPrefix}
            onChange={(e) => setPromptPrefix(e.target.value)}
            placeholder="e.g., You are a skeptical scientist who values empirical evidence and questions assumptions..."
            className={`input-base min-h-[120px] resize-none ${errors.promptPrefix ? 'border-status-error focus:border-status-error focus:ring-status-error' : ''}`}
            rows={4}
          />
          {errors.promptPrefix ? (
            <p className="text-xs text-status-error">{errors.promptPrefix}</p>
          ) : (
            <p className="text-xs text-text-tertiary">
              This text will be prepended to each question. {promptPrefix.length}/500 characters
            </p>
          )}
        </div>

        {/* Preview */}
        {promptPrefix.trim() && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">
              Preview
            </p>
            <div className="text-sm text-text-secondary">
              <span className="text-accent font-medium">{promptPrefix.trim()}</span>
              <span className="text-text-tertiary"> + [Question text]</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!name.trim() || !promptPrefix.trim()}
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Persona
          </Button>
        </div>
      </div>
    </Modal>
  )
}
