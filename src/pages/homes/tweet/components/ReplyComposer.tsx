import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ReplyComposerProps {
  onReply: (content: string) => void;
}

export default function ReplyComposer({ onReply }: ReplyComposerProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    const text = content.trim();
    if (!text || isSubmitting) return;

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      onReply(text);
      setContent('');
      setIsSubmitting(false);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const remaining = 280 - content.length;
  const ringColor = content.length > 260 ? '#ef4444' : content.length > 240 ? '#f59e0b' : '#3b82f6';

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-4">
      <div className="flex space-x-3">
        {/* shadcn Avatar */}
        <Avatar className="h-10 w-10">
          <AvatarImage src="/default-avatar.svg" alt="Your avatar" />
          <AvatarFallback>YOU</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tweet your reply"
            className="w-full resize-none border-none outline-none text-xl placeholder-gray-500 bg-transparent text-gray-900 dark:text-gray-100"
            rows={3}
            maxLength={280}
          />

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="text-blue-500 hover:bg-blue-50 dark:hover:bg-primary/10 p-2 rounded-full transition-colors">
                <i className="ri-image-line text-xl" />
              </button>
              <button className="text-blue-500 hover:bg-blue-50 dark:hover:bg-primary/10 p-2 rounded-full transition-colors">
                <i className="ri-file-gif-line text-xl" />
              </button>
              <button className="text-blue-500 hover:bg-blue-50 dark:hover:bg-primary/10 p-2 rounded-full transition-colors">
                <i className="ri-emotion-line text-xl" />
              </button>
              <button className="text-blue-500 hover:bg-blue-50 dark:hover:bg-primary/10 p-2 rounded-full transition-colors">
                <i className="ri-calendar-event-line text-xl" />
              </button>
              <button className="text-blue-500 hover:bg-blue-50 dark:hover:bg-primary/10 p-2 rounded-full transition-colors">
                <i className="ri-map-pin-line text-xl" />
              </button>
            </div>

            <div className="flex items-center space-x-3">
              {content.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="relative h-8 w-8">
                    <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
                      <circle cx="16" cy="16" r="14" stroke="#e5e7eb" strokeWidth="2" fill="none" />
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke={ringColor}
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={`${(content.length / 280) * 87.96} 87.96`}
                        className="transition-all duration-200"
                      />
                    </svg>
                    {content.length > 240 && (
                      <span
                        className={`absolute inset-0 flex items-center justify-center text-xs font-medium ${
                          content.length > 260 ? 'text-red-500' : 'text-yellow-500'
                        }`}
                      >
                        {remaining}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || content.length > 280 || isSubmitting}
                className="whitespace-nowrap"
              >
                {isSubmitting ? 'Replying...' : 'Reply'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
