'use client'

import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  ComposedChart,
  Line,
  Rectangle,
} from 'recharts'

// Types for statistics structure
interface ScaleStats {
  mean: number | null
  subscales: Record<string, number | null>
  item_scores: Record<string, number>
  n_items: number
  n_warnings: number
}

interface Statistics {
  [model: string]: {
    [persona: string]: {
      [scale: string]: ScaleStats
    }
  }
}

interface ResultsChartsProps {
  statistics: Statistics
  scales: string[]
  models: string[]
  personas: string[]
}

type ChartType = 'bar' | 'radar' | 'heatmap' | 'distribution'

// Color palette for charts
const COLORS = [
  '#0ea5e9', // sky-500
  '#8b5cf6', // violet-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
]

// Get short model name for display
function getShortModelName(model: string): string {
  const parts = model.split('/')
  return parts[parts.length - 1].slice(0, 20)
}

// Custom Tooltip for charts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-surface-secondary border border-border-primary rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-text-primary mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-text-secondary">{entry.name}:</span>
          <span className="font-medium text-text-primary">
            {typeof entry.value === 'number' ? entry.value.toFixed(2) : 'N/A'}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ResultsCharts({
  statistics,
  scales,
  models,
  personas,
}: ResultsChartsProps) {
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [selectedScale, setSelectedScale] = useState<string>(scales[0] || '')
  const [groupBy, setGroupBy] = useState<'model' | 'persona'>('model')

  // Prepare bar chart data
  const barChartData = useMemo(() => {
    if (!selectedScale) return []

    if (groupBy === 'model') {
      return models.map((model) => {
        const row: Record<string, string | number | null> = {
          name: getShortModelName(model),
          fullName: model,
        }
        personas.forEach((persona) => {
          const stats = statistics[model]?.[persona]?.[selectedScale]
          row[persona] = stats?.mean ?? null
        })
        return row
      })
    } else {
      return personas.map((persona) => {
        const row: Record<string, string | number | null> = {
          name: persona,
        }
        models.forEach((model) => {
          const stats = statistics[model]?.[persona]?.[selectedScale]
          row[getShortModelName(model)] = stats?.mean ?? null
        })
        return row
      })
    }
  }, [statistics, models, personas, selectedScale, groupBy])

  // Prepare radar chart data (for scales that have subscales or multiple scores)
  const radarChartData = useMemo(() => {
    // Get all unique subscales for the selected scale across all models/personas
    const subscaleSet = new Set<string>()

    models.forEach((model) => {
      personas.forEach((persona) => {
        const stats = statistics[model]?.[persona]?.[selectedScale]
        if (stats?.subscales) {
          Object.keys(stats.subscales).forEach((sub) => subscaleSet.add(sub))
        }
      })
    })

    const subscales = Array.from(subscaleSet)

    // If no subscales, use scales themselves as dimensions
    if (subscales.length === 0) {
      return scales.map((scale) => {
        const row: Record<string, string | number | null> = { subject: scale }
        models.forEach((model) => {
          // Average across personas for radar
          const values = personas
            .map((p) => statistics[model]?.[p]?.[scale]?.mean)
            .filter((v): v is number => v !== null && v !== undefined)
          row[getShortModelName(model)] =
            values.length > 0
              ? values.reduce((a, b) => a + b, 0) / values.length
              : null
        })
        return row
      })
    }

    // Use subscales as radar dimensions
    return subscales.map((subscale) => {
      const row: Record<string, string | number | null> = { subject: subscale }
      models.forEach((model) => {
        const values = personas
          .map((p) => statistics[model]?.[p]?.[selectedScale]?.subscales?.[subscale])
          .filter((v): v is number => v !== null && v !== undefined)
        row[getShortModelName(model)] =
          values.length > 0
            ? values.reduce((a, b) => a + b, 0) / values.length
            : null
      })
      return row
    })
  }, [statistics, models, personas, scales, selectedScale])

  // Prepare heatmap data
  const heatmapData = useMemo(() => {
    if (!selectedScale) return []

    return models.flatMap((model) =>
      personas.map((persona) => ({
        model: getShortModelName(model),
        fullModel: model,
        persona,
        value: statistics[model]?.[persona]?.[selectedScale]?.mean ?? null,
      }))
    )
  }, [statistics, models, personas, selectedScale])

  // Get min/max for heatmap color scaling
  const heatmapRange = useMemo(() => {
    const values = heatmapData
      .map((d) => d.value)
      .filter((v): v is number => v !== null)
    if (values.length === 0) return { min: 0, max: 1 }
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    }
  }, [heatmapData])

  // Distribution data (box plot approximation)
  const distributionData = useMemo(() => {
    if (!selectedScale) return []

    return models.map((model) => {
      const allScores: number[] = []
      personas.forEach((persona) => {
        const itemScores = statistics[model]?.[persona]?.[selectedScale]?.item_scores
        if (itemScores) {
          allScores.push(...Object.values(itemScores))
        }
      })

      if (allScores.length === 0) {
        return {
          name: getShortModelName(model),
          min: null,
          q1: null,
          median: null,
          q3: null,
          max: null,
          mean: null,
        }
      }

      allScores.sort((a, b) => a - b)
      const n = allScores.length
      const q1Idx = Math.floor(n * 0.25)
      const medianIdx = Math.floor(n * 0.5)
      const q3Idx = Math.floor(n * 0.75)

      return {
        name: getShortModelName(model),
        min: allScores[0],
        q1: allScores[q1Idx],
        median: allScores[medianIdx],
        q3: allScores[q3Idx],
        max: allScores[n - 1],
        mean: allScores.reduce((a, b) => a + b, 0) / n,
      }
    })
  }, [statistics, models, personas, selectedScale])

  // Get color for heatmap cell
  const getHeatmapColor = (value: number | null) => {
    if (value === null) return '#374151' // gray-700
    const { min, max } = heatmapRange
    const normalized = (value - min) / (max - min || 1)
    // Gradient from blue (low) to green (mid) to red (high)
    if (normalized < 0.5) {
      const t = normalized * 2
      return `rgb(${Math.round(14 + t * (16 - 14))}, ${Math.round(165 + t * (185 - 165))}, ${Math.round(233 - t * (100))})`
    } else {
      const t = (normalized - 0.5) * 2
      return `rgb(${Math.round(16 + t * (239 - 16))}, ${Math.round(185 - t * (117))}, ${Math.round(129 - t * (61))})`
    }
  }

  const chartTypes: { value: ChartType; label: string; icon: JSX.Element }[] = [
    {
      value: 'bar',
      label: 'Bar Chart',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      value: 'radar',
      label: 'Radar Chart',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      ),
    },
    {
      value: 'heatmap',
      label: 'Heatmap',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
    {
      value: 'distribution',
      label: 'Distribution',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Chart Type Selector */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1 p-1 bg-surface-muted rounded-lg">
          {chartTypes.map((ct) => (
            <button
              key={ct.value}
              onClick={() => setChartType(ct.value)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                chartType === ct.value
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
              }`}
            >
              {ct.icon}
              <span className="hidden sm:inline">{ct.label}</span>
            </button>
          ))}
        </div>

        {/* Scale Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary">Scale:</label>
          <select
            value={selectedScale}
            onChange={(e) => setSelectedScale(e.target.value)}
            className="text-sm bg-surface-secondary border border-border-primary rounded-md px-2 py-1 text-text-primary"
          >
            {scales.map((scale) => (
              <option key={scale} value={scale}>
                {scale}
              </option>
            ))}
          </select>
        </div>

        {/* Group By (for bar chart) */}
        {chartType === 'bar' && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">Group by:</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'model' | 'persona')}
              className="text-sm bg-surface-secondary border border-border-primary rounded-md px-2 py-1 text-text-primary"
            >
              <option value="model">Model</option>
              <option value="persona">Persona</option>
            </select>
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div className="bg-surface-secondary border border-border-primary rounded-xl p-4">
        {chartType === 'bar' && (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={60}
                />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                {groupBy === 'model'
                  ? personas.map((persona, idx) => (
                      <Bar
                        key={persona}
                        dataKey={persona}
                        fill={COLORS[idx % COLORS.length]}
                        radius={[4, 4, 0, 0]}
                      />
                    ))
                  : models.map((model, idx) => (
                      <Bar
                        key={model}
                        dataKey={getShortModelName(model)}
                        fill={COLORS[idx % COLORS.length]}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartType === 'radar' && (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarChartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                />
                <PolarRadiusAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {models.map((model, idx) => (
                  <Radar
                    key={model}
                    name={getShortModelName(model)}
                    dataKey={getShortModelName(model)}
                    stroke={COLORS[idx % COLORS.length]}
                    fill={COLORS[idx % COLORS.length]}
                    fillOpacity={0.2}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartType === 'heatmap' && (
          <div className="overflow-x-auto">
            <div className="min-w-fit">
              {/* Heatmap Grid */}
              <div className="flex flex-col gap-1">
                {/* Header row */}
                <div className="flex gap-1">
                  <div className="w-28 flex-shrink-0" />
                  {personas.map((persona) => (
                    <div
                      key={persona}
                      className="w-20 text-center text-xs text-text-secondary truncate px-1"
                      title={persona}
                    >
                      {persona}
                    </div>
                  ))}
                </div>
                {/* Data rows */}
                {models.map((model) => (
                  <div key={model} className="flex gap-1 items-center">
                    <div
                      className="w-28 flex-shrink-0 text-xs text-text-secondary truncate pr-2"
                      title={model}
                    >
                      {getShortModelName(model)}
                    </div>
                    {personas.map((persona) => {
                      const value = statistics[model]?.[persona]?.[selectedScale]?.mean
                      return (
                        <div
                          key={`${model}-${persona}`}
                          className="w-20 h-10 rounded flex items-center justify-center text-xs font-medium cursor-pointer transition-transform hover:scale-105"
                          style={{ backgroundColor: getHeatmapColor(value ?? null) }}
                          title={`${getShortModelName(model)} × ${persona}: ${value?.toFixed(2) ?? 'N/A'}`}
                        >
                          <span className="text-white drop-shadow-sm">
                            {value !== null && value !== undefined ? value.toFixed(1) : '—'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
              {/* Legend */}
              <div className="mt-4 flex items-center gap-2 text-xs text-text-secondary">
                <span>Low</span>
                <div className="w-32 h-3 rounded" style={{
                  background: 'linear-gradient(to right, #0ea5e9, #10b981, #ef4444)'
                }} />
                <span>High</span>
                <span className="ml-4">({heatmapRange.min.toFixed(1)} - {heatmapRange.max.toFixed(1)})</span>
              </div>
            </div>
          </div>
        )}

        {chartType === 'distribution' && (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={distributionData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={60}
                />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {/* IQR range (Q1 to Q3) */}
                <Bar dataKey="q1" stackId="a" fill="transparent" />
                <Bar
                  dataKey="q3"
                  name="IQR (Q1-Q3)"
                  stackId="a"
                  fill="#0ea5e9"
                  fillOpacity={0.3}
                  radius={[4, 4, 0, 0]}
                />
                {/* Median line */}
                <Line
                  type="monotone"
                  dataKey="median"
                  name="Median"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                />
                {/* Mean line */}
                <Line
                  type="monotone"
                  dataKey="mean"
                  name="Mean"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#f59e0b', r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart Description */}
      <p className="text-xs text-text-tertiary">
        {chartType === 'bar' &&
          `Comparing ${selectedScale} scores across ${groupBy === 'model' ? 'models' : 'personas'}. Each bar represents the mean score.`}
        {chartType === 'radar' &&
          `Profile comparison showing ${radarChartData.length > scales.length ? 'subscales' : 'all scales'} for each model (averaged across personas).`}
        {chartType === 'heatmap' &&
          `Model × Persona matrix for ${selectedScale}. Darker blue = lower scores, darker red = higher scores.`}
        {chartType === 'distribution' &&
          `Score distribution for ${selectedScale}. Shows median (solid), mean (dashed), and interquartile range (IQR).`}
      </p>
    </div>
  )
}
