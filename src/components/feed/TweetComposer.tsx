// src/components/TweetComposer.tsx
import { useEffect, useRef, useState } from 'react'
import { Image, BarChart3, Smile, Calendar, FileVideo } from 'lucide-react'

interface TweetComposerProps {
  onPost: (content: string) => void
}

export default function TweetComposer({ onPost }: TweetComposerProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [content])

  const handlePost = () => {
    if (!content.trim()) return
    onPost(content)
    setContent('')
  }

  return (
    <div className="border-b border-gray-200 p-4">
      <div className="flex space-x-3">
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=You"
          alt="Your avatar"
          className="w-12 h-12 rounded-full object-cover"
        />

        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What is happening?!"
            rows={3}
            className="w-full text-xl placeholder-gray-500 border-none resize-none outline-none bg-transparent"
          />

          <div className="flex items-center justify-between mt-4">
            <div className="flex space-x-3 text-primary">
              {[Image, FileVideo, BarChart3, Smile, Calendar].map((Icon, i) => (
                <button
                  key={i}
                  className="hover:bg-blue-50 p-2 rounded-full transition"
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>

            <button
              disabled={!content.trim()}
              onClick={handlePost}
              className={`font-bold py-2 px-6 rounded-full text-white transition-colors ${
                content.trim()
                  ? 'bg-primary hover:bg-blue-600'
                  : 'bg-primary opacity-50 cursor-not-allowed'
              }`}
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
