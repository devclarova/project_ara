import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react';

interface ComposeBoxProps {
  onTweetPost?: (tweet: {
    id: string;
    user: {
      name: string;
      username: string;
      avatar: string;
    };
    content: string;
    image?: string;
    timestamp: string;
    stats: {
      replies: number;
      retweets: number;
      likes: number;
      views: number;
    };
  }) => void;
}

export default function ComposeBox({ onTweetPost }: ComposeBoxProps) {
  const [tweetText, setTweetText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxLength = 280;

  const emojis = ['😀', '😂', '🥰', '😍', '🤔', '👍', '❤️', '🔥', '💯', '🎉', '🚀', '✨'];

  const handleTweet = () => {
    if (tweetText.trim()) {
      const newTweet = {
        id: `tweet-${Date.now()}`,
        user: {
          name: 'You',
          username: 'yourhandle',
          // avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20a%20young%20person%20with%20friendly%20smile%2C%20clean%20background%2C%20high%20quality%20portrait%20photography%2C%20modern%20lighting&width=48&height=48&seq=user-avatar&orientation=squarish',
          avatar: '/default-avatar.svg',
        },
        content: tweetText,
        image: selectedImages.length > 0 ? selectedImages[0] : undefined,
        timestamp: 'now',
        stats: {
          replies: 0,
          retweets: 0,
          likes: 0,
          views: Math.floor(Math.random() * 100) + 1,
        },
      };

      onTweetPost?.(newTweet);

      // Reset composer
      setTweetText('');
      setSelectedImages([]);
      setShowOptions(false);
      setShowEmojiPicker(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
          if (e.target?.result) {
            newImages.push(e.target.result as string);
            if (newImages.length === files.length) {
              setSelectedImages(prev => [...prev, ...newImages].slice(0, 4)); // Max 4 images
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const addEmoji = (emoji: string) => {
    setTweetText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="border-b border-gray-200 p-4 min-w-[320px]">
      <div className="flex space-x-3 w-full">
        <div className="flex-shrink-0">
          <Avatar className="w-10 h-10">
            <AvatarImage src="/default-avatar.svg" alt="User avatar" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          <textarea
            value={tweetText}
            onChange={e => setTweetText(e.target.value)}
            placeholder="What's happening?"
            className="w-full text-xl placeholder-gray-500 border-none resize-none focus:outline-none bg-transparent"
            rows={3}
            maxLength={maxLength}
            onFocus={() => setShowOptions(true)}
          />

          {/* Image Previews */}
          {selectedImages.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {selectedImages.map((image, index) => (
                <div
                  key={index}
                  className="relative rounded-xl overflow-hidden border border-gray-200"
                >
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                  >
                    <i className="ri-close-line text-sm"></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          {showOptions && (
            <div className="mt-4 w-full">
              {/* Media Options */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap">
                  {/* Image Upload */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors cursor-pointer flex-shrink-0"
                  >
                    <i className="ri-image-line text-lg w-5 h-5 flex items-center justify-center"></i>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {/* GIF */}
                  <button className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors cursor-pointer flex-shrink-0">
                    <i className="ri-file-gif-line text-lg w-5 h-5 flex items-center justify-center"></i>
                  </button>

                  {/* Poll */}
                  <button className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors cursor-pointer flex-shrink-0">
                    <i className="ri-bar-chart-horizontal-line text-lg w-5 h-5 flex items-center justify-center"></i>
                  </button>

                  {/* Emoji */}
                  <div className="relative">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors cursor-pointer flex-shrink-0"
                    >
                      <i className="ri-emotion-line text-lg w-5 h-5 flex items-center justify-center"></i>
                    </button>

                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div className="absolute top-12 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-10">
                        <div className="grid grid-cols-6 gap-2">
                          {emojis.map((emoji, index) => (
                            <button
                              key={index}
                              onClick={() => addEmoji(emoji)}
                              className="text-xl hover:bg-gray-100 p-2 rounded-lg transition-colors cursor-pointer"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Calendar */}
                  <button className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors cursor-pointer flex-shrink-0">
                    <i className="ri-calendar-event-line text-lg w-5 h-5 flex items-center justify-center"></i>
                  </button>
                </div>

                <div className="flex items-center space-x-3 flex-shrink-0">
                  {/* Character Counter */}
                  <div className="flex items-center space-x-2">
                    <div
                      className={`text-sm ${
                        tweetText.length > maxLength * 0.8 ? 'text-red-500' : 'text-gray-500'
                      }`}
                    >
                      {maxLength - tweetText.length}
                    </div>
                    <div className="w-6 h-6 relative flex-shrink-0">
                      <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 24 24">
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          className="text-gray-200"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 10}`}
                          strokeDashoffset={`${
                            2 * Math.PI * 10 * (1 - tweetText.length / maxLength)
                          }`}
                          className={
                            tweetText.length > maxLength * 0.8 ? 'text-red-500' : 'text-blue-500'
                          }
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Tweet Button */}
                  <Button
                    onClick={handleTweet}
                    disabled={!tweetText.trim() || tweetText.length > maxLength}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-1.5 rounded-full font-bold text-sm transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
                  >
                    Tweet
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
