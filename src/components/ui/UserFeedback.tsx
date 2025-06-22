// ユーザーフィードバック収集コンポーネント
'use client'

import { useState } from 'react'

interface UserFeedbackProps {
  onSubmit?: (feedback: string, rating: number) => void
}

export function UserFeedback({ onSubmit }: UserFeedbackProps) {
  const [feedback, setFeedback] = useState('')
  const [rating, setRating] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (feedback || rating > 0) {
      onSubmit?.(feedback, rating)
      setSubmitted(true)
      
      // ローカルストレージに保存（簡易実装）
      const feedbackData = {
        feedback,
        rating,
        timestamp: new Date().toISOString()
      }
      const existing = JSON.parse(localStorage.getItem('userFeedback') || '[]')
      existing.push(feedbackData)
      localStorage.setItem('userFeedback', JSON.stringify(existing))
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 p-4 rounded text-green-800">
        ✅ フィードバックありがとうございました！
      </div>
    )
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-2">ご意見をお聞かせください</h3>
      
      <div className="mb-3">
        <p className="text-sm mb-1">使いやすさ評価：</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className={`w-8 h-8 rounded ${
                rating >= n ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="改善点やご要望があればお書きください"
        className="w-full p-2 border rounded mb-2"
        rows={3}
      />

      <button
        onClick={handleSubmit}
        disabled={!feedback && rating === 0}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        送信
      </button>
    </div>
  )
}