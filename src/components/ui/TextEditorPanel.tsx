'use client'

import { useState, useEffect, useCallback } from 'react'
import { TextElement, TextStyle, TextAnimation } from '../../lib/video-text-editor'

interface TextEditorPanelProps {
  elements: TextElement[]
  selectedElementId: string | null
  currentTime: number
  videoDuration: number
  canvasSize?: { width: number; height: number }
  onElementAdd: (element: Partial<TextElement>) => void
  onElementUpdate: (id: string, updates: Partial<TextElement>) => void
  onElementDelete: (id: string) => void
  onElementSelect: (id: string | null) => void
}

interface TextPreset {
  name: string
  style: Partial<TextStyle>
  size?: { width: number; height: number }
}

const textPresets: TextPreset[] = [
  {
    name: 'タイトル',
    style: {
      fontSize: 48,
      fontFamily: 'Impact',
      color: '#ffffff',
      textAlign: 'center',
      fontWeight: 'bold'
    },
    size: { width: 400, height: 80 }
  },
  {
    name: '字幕',
    style: {
      fontSize: 32,
      fontFamily: 'Noto Sans JP',
      color: '#ffffff',
      textAlign: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)'
    },
    size: { width: 600, height: 60 }
  },
  {
    name: 'キャプション',
    style: {
      fontSize: 24,
      fontFamily: 'Arial',
      color: '#333333',
      textAlign: 'left',
      backgroundColor: 'rgba(255,255,255,0.9)'
    },
    size: { width: 300, height: 40 }
  }
]

const availableFonts = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
  'Impact', 'Comic Sans MS', 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic'
]

export function TextEditorPanel({
  elements,
  selectedElementId,
  currentTime,
  videoDuration,
  onElementAdd,
  onElementUpdate,
  onElementDelete,
  onElementSelect
}: TextEditorPanelProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'properties'>('list')

  const selectedElement = selectedElementId ? elements.find(e => e.id === selectedElementId) : null

  // Check if element is active at current time
  const isElementActive = useCallback((element: TextElement) => {
    return currentTime >= element.timing.startTime && currentTime <= element.timing.endTime
  }, [currentTime])

  const handleDeleteElement = useCallback((elementId: string) => {
    setShowDeleteConfirm(elementId)
  }, [])

  const handleDuplicateElement = useCallback((elementId: string) => {
    const element = elements.find(e => e.id === elementId)
    if (!element) return

    const duplicatedElement: Partial<TextElement> = {
      ...element,
      id: undefined,
      position: {
        x: element.position.x + 20,
        y: element.position.y + 20
      },
      timing: {
        ...element.timing,
        startTime: currentTime,
        endTime: Math.min(currentTime + (element.timing.endTime - element.timing.startTime), videoDuration)
      }
    }

    onElementAdd(duplicatedElement)
  }, [elements, currentTime, videoDuration, onElementAdd])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return

      if (e.key === 'Delete') {
        e.preventDefault()
        handleDeleteElement(selectedElementId)
      }

      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleDuplicateElement(selectedElementId)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedElementId, handleDeleteElement, handleDuplicateElement])

  // Switch to properties tab when element is selected
  useEffect(() => {
    if (selectedElementId) {
      setActiveTab('properties')
    }
  }, [selectedElementId])

  const handleAddTextElement = useCallback((preset?: TextPreset) => {
    const newElement: Partial<TextElement> = {
      content: '新しいテキスト',
      position: { x: 50, y: 50 },
      size: preset?.size || { width: 200, height: 40 },
      style: {
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: 'transparent',
        fontWeight: 'normal',
        textAlign: 'center',
        textDecoration: 'none',
        ...preset?.style
      },
      timing: {
        startTime: currentTime,
        endTime: Math.min(currentTime + 3, videoDuration),
        fadeIn: 0.5,
        fadeOut: 0.5
      },
      visible: true
    }

    onElementAdd(newElement)
  }, [currentTime, videoDuration, onElementAdd])

  const handleElementSelect = useCallback((elementId: string) => {
    onElementSelect(elementId === selectedElementId ? null : elementId)
  }, [selectedElementId, onElementSelect])

  const confirmDelete = useCallback(() => {
    if (showDeleteConfirm) {
      onElementDelete(showDeleteConfirm)
      setShowDeleteConfirm(null)
      onElementSelect(null)
    }
  }, [showDeleteConfirm, onElementDelete, onElementSelect])

  const handleStyleUpdate = useCallback((updates: Partial<TextStyle>) => {
    if (!selectedElementId || !selectedElement) return
    onElementUpdate(selectedElementId, { 
      style: { ...selectedElement.style, ...updates }
    })
  }, [selectedElementId, selectedElement, onElementUpdate])

  const handlePositionUpdate = useCallback((position: { x?: number; y?: number }) => {
    if (!selectedElementId || !selectedElement) return
    
    const newPosition = {
      x: position.x !== undefined ? position.x : selectedElement.position.x,
      y: position.y !== undefined ? position.y : selectedElement.position.y
    }
    
    onElementUpdate(selectedElementId, { position: newPosition })
  }, [selectedElementId, selectedElement, onElementUpdate])

  const handleSizeUpdate = useCallback((size: { width?: number; height?: number }) => {
    if (!selectedElementId || !selectedElement) return
    
    const newSize = {
      width: size.width !== undefined ? size.width : selectedElement.size.width,
      height: size.height !== undefined ? size.height : selectedElement.size.height
    }
    
    onElementUpdate(selectedElementId, { size: newSize })
  }, [selectedElementId, selectedElement, onElementUpdate])

  const handleTimingUpdate = useCallback((timing: Partial<TextElement['timing']>) => {
    if (!selectedElementId || !selectedElement) return
    
    const newTiming = { ...selectedElement.timing, ...timing }
    onElementUpdate(selectedElementId, { timing: newTiming })
  }, [selectedElementId, selectedElement, onElementUpdate])

  const handleLayerUpdate = useCallback((action: 'front' | 'back') => {
    if (!selectedElementId) return
    
    const maxLayer = Math.max(...elements.map(e => e.layer))
    const minLayer = Math.min(...elements.map(e => e.layer))
    
    const newLayer = action === 'front' ? maxLayer + 1 : minLayer - 1
    onElementUpdate(selectedElementId, { layer: newLayer })
  }, [selectedElementId, elements, onElementUpdate])

  return (
    <div data-testid="text-editor-panel" className="text-editor-panel bg-white border border-gray-300 rounded-lg">
      {/* Header Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 ${activeTab === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
        >
          テキスト一覧
        </button>
        <button
          onClick={() => setActiveTab('properties')}
          className={`px-4 py-2 ${activeTab === 'properties' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
        >
          プロパティ
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'list' ? (
          /* Text Elements List */
          <div>
            {/* Add Text Controls */}
            <div className="mb-4">
              <button
                data-testid="add-text-button"
                onClick={() => handleAddTextElement()}
                className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-2"
              >
                テキストを追加
              </button>

              <select
                data-testid="text-presets-dropdown"
                onChange={(e) => {
                  const preset = textPresets.find(p => p.name === e.target.value)
                  if (preset) handleAddTextElement(preset)
                  e.target.value = ''
                }}
                className="w-full p-2 border border-gray-300 rounded"
                defaultValue=""
              >
                <option value="" disabled>プリセットを選択</option>
                {textPresets.map(preset => (
                  <option key={preset.name} value={preset.name}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Elements List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {elements.map(element => (
                <div
                  key={element.id}
                  data-testid={`text-element-${element.id}`}
                  className={`
                    p-3 border rounded cursor-pointer transition-all
                    ${selectedElementId === element.id ? 'border-blue-500 bg-blue-50 selected' : 'border-gray-200 hover:bg-gray-50'}
                    ${isElementActive(element) ? 'ring-2 ring-green-300 active' : ''}
                  `}
                  onClick={() => handleElementSelect(element.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm truncate flex-1">
                      {element.content}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        data-testid={`visibility-toggle-${element.id}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onElementUpdate(element.id, { visible: !element.visible })
                        }}
                        className={`
                          p-1 rounded text-xs
                          ${element.visible ? 'bg-green-100 text-green-800 visible' : 'bg-gray-100 text-gray-500'}
                        `}
                      >
                        {element.visible ? '👁️' : '🙈'}
                      </button>
                      <span className="text-xs text-gray-500">レイヤー {element.layer}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    {element.timing.startTime}s - {element.timing.endTime}s
                  </div>

                  {selectedElementId === element.id && (
                    <div className="flex gap-2 mt-2">
                      <button
                        data-testid={`duplicate-element-${element.id}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDuplicateElement(element.id)
                        }}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                      >
                        複製
                      </button>
                      <button
                        data-testid={`delete-element-${element.id}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteElement(element.id)
                        }}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                      >
                        削除
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Properties Panel */
          selectedElement && (
            <div data-testid="text-properties-panel" className="space-y-4">
              <h3 className="font-semibold text-lg">テキスト設定</h3>

              {/* Text Content */}
              <div>
                <label className="block text-sm font-medium mb-1">テキスト内容</label>
                <textarea
                  data-testid="text-content-input"
                  value={selectedElement.content}
                  onChange={(e) => onElementUpdate(selectedElementId!, { content: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded resize-none"
                  rows={3}
                />
              </div>

              {/* Font Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">フォント</label>
                  <select
                    data-testid="font-family-selector"
                    value={selectedElement.style.fontFamily}
                    onChange={(e) => handleStyleUpdate({ fontFamily: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    {availableFonts.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">サイズ</label>
                  <input
                    data-testid="font-size-input"
                    type="number"
                    value={selectedElement.style.fontSize}
                    onChange={(e) => handleStyleUpdate({ fontSize: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded"
                    min="8"
                    max="200"
                  />
                </div>
              </div>

              {/* Color Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">文字色</label>
                  <input
                    data-testid="text-color-picker"
                    type="color"
                    value={selectedElement.style.color}
                    onChange={(e) => handleStyleUpdate({ color: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">背景色</label>
                  <input
                    type="color"
                    value={selectedElement.style.backgroundColor?.replace('rgba(0,0,0,0.5)', '#000000') || '#000000'}
                    onChange={(e) => handleStyleUpdate({ backgroundColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded"
                  />
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <label className="block text-sm font-medium mb-1">配置</label>
                <div className="flex gap-2">
                  <button
                    data-testid="align-left-button"
                    onClick={() => handleStyleUpdate({ textAlign: 'left' })}
                    className={`px-3 py-2 border rounded ${selectedElement.style.textAlign === 'left' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                  >
                    左
                  </button>
                  <button
                    data-testid="align-center-button"
                    onClick={() => handleStyleUpdate({ textAlign: 'center' })}
                    className={`px-3 py-2 border rounded ${selectedElement.style.textAlign === 'center' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                  >
                    中央
                  </button>
                  <button
                    data-testid="align-right-button"
                    onClick={() => handleStyleUpdate({ textAlign: 'right' })}
                    className={`px-3 py-2 border rounded ${selectedElement.style.textAlign === 'right' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                  >
                    右
                  </button>
                </div>
              </div>

              {/* Position and Size */}
              <div>
                <label className="block text-sm font-medium mb-1">位置とサイズ</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">X座標</label>
                    <input
                      data-testid="position-x-input"
                      type="number"
                      value={selectedElement.position.x}
                      onChange={(e) => handlePositionUpdate({ x: parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Y座標</label>
                    <input
                      data-testid="position-y-input"
                      type="number"
                      value={selectedElement.position.y}
                      onChange={(e) => handlePositionUpdate({ y: parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">幅</label>
                    <input
                      data-testid="size-width-input"
                      type="number"
                      value={selectedElement.size.width}
                      onChange={(e) => handleSizeUpdate({ width: parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">高さ</label>
                    <input
                      data-testid="size-height-input"
                      type="number"
                      value={selectedElement.size.height}
                      onChange={(e) => handleSizeUpdate({ height: parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Timing Panel */}
              <div data-testid="timing-panel">
                <label className="block text-sm font-medium mb-1">表示タイミング</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">開始時間（秒）</label>
                    <input
                      data-testid="start-time-input"
                      type="number"
                      value={selectedElement.timing.startTime}
                      onChange={(e) => handleTimingUpdate({ startTime: parseFloat(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded"
                      min="0"
                      max={videoDuration}
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">終了時間（秒）</label>
                    <input
                      data-testid="end-time-input"
                      type="number"
                      value={selectedElement.timing.endTime}
                      onChange={(e) => handleTimingUpdate({ endTime: parseFloat(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded"
                      min="0"
                      max={videoDuration}
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">フェードイン（秒）</label>
                    <input
                      data-testid="fade-in-input"
                      type="number"
                      value={selectedElement.timing.fadeIn}
                      onChange={(e) => handleTimingUpdate({ fadeIn: parseFloat(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded"
                      min="0"
                      max="5"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">フェードアウト（秒）</label>
                    <input
                      data-testid="fade-out-input"
                      type="number"
                      value={selectedElement.timing.fadeOut}
                      onChange={(e) => handleTimingUpdate({ fadeOut: parseFloat(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded"
                      min="0"
                      max="5"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              {/* Layer Controls */}
              <div>
                <label className="block text-sm font-medium mb-1">レイヤー</label>
                <div className="flex gap-2">
                  <button
                    data-testid="move-to-front-button"
                    onClick={() => handleLayerUpdate('front')}
                    className="px-3 py-2 bg-blue-500 text-white rounded text-sm"
                  >
                    最前面
                  </button>
                  <button
                    data-testid="move-to-back-button"
                    onClick={() => handleLayerUpdate('back')}
                    className="px-3 py-2 bg-gray-500 text-white rounded text-sm"
                  >
                    最背面
                  </button>
                </div>
              </div>

              {/* Animation Controls */}
              <div>
                <label className="block text-sm font-medium mb-1">アニメーション</label>
                <select
                  data-testid="animation-type-dropdown"
                  value={selectedElement.animation?.type || 'none'}
                  onChange={(e) => {
                    const animation: TextAnimation = {
                      type: e.target.value as TextAnimation['type'],
                      duration: 1,
                      easing: 'ease-in-out'
                    }
                    onElementUpdate(selectedElementId!, { animation })
                  }}
                  className="w-full p-2 border border-gray-300 rounded mb-2"
                >
                  <option value="none">なし</option>
                  <option value="fadeIn">フェードイン</option>
                  <option value="slideIn">スライドイン</option>
                  <option value="scaleIn">スケールイン</option>
                  <option value="typewriter">タイプライター</option>
                  <option value="bounce">バウンス</option>
                </select>

                {selectedElement.animation?.type === 'slideIn' && (
                  <select
                    data-testid="animation-direction-dropdown"
                    value={selectedElement.animation.direction || 'left'}
                    onChange={(e) => {
                      const animation = { 
                        ...selectedElement.animation!,
                        direction: e.target.value as TextAnimation['direction']
                      }
                      onElementUpdate(selectedElementId!, { animation })
                    }}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="left">左から</option>
                    <option value="right">右から</option>
                    <option value="top">上から</option>
                    <option value="bottom">下から</option>
                  </select>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
            <h3 className="font-semibold mb-4">テキストを削除しますか？</h3>
            <p className="text-gray-600 mb-4">この操作は取り消せません。</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded"
              >
                キャンセル
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}