import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';

interface TweetModalProps {
  onClose: () => void;
}

export default function TweetModal({ onClose }: TweetModalProps) {
  const [tweetText, setTweetText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!tweetText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    // Simulate tweet submission
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg mx-auto shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Compose Tweet</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl text-gray-600"></i>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4">
          <div className="flex space-x-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="w-12 h-12">
                <AvatarImage
                  src="https://readdy.ai/api/search-image?query=professional%20headshot%20of%20a%20young%20person%20with%20friendly%20smile%2C%20clean%20background%2C%20high%20quality%20portrait%20photography%2C%20modern%20lighting&width=48&height=48&seq=modal-avatar-1&orientation=squarish"
                  alt="User avatar"
                />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </div>

            {/* Tweet Input */}
            <div className="flex-1">
              <textarea
                value={tweetText}
                onChange={e => setTweetText(e.target.value)}
                placeholder="What's happening?"
                className="w-full resize-none border-none outline-none text-xl placeholder-gray-500 min-h-[120px] bg-transparent"
                maxLength={280}
                autoFocus
              />

              {/* Character Count */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  <button className="w-8 h-8 rounded-full hover:bg-blue-50 flex items-center justify-center transition-colors cursor-pointer">
                    <i className="ri-image-line text-blue-500 text-lg"></i>
                  </button>
                  <button className="w-8 h-8 rounded-full hover:bg-blue-50 flex items-center justify-center transition-colors cursor-pointer">
                    <i className="ri-file-gif-line text-blue-500 text-lg"></i>
                  </button>
                  <button className="w-8 h-8 rounded-full hover:bg-blue-50 flex items-center justify-center transition-colors cursor-pointer">
                    <i className="ri-emotion-line text-blue-500 text-lg"></i>
                  </button>
                  <button className="w-8 h-8 rounded-full hover:bg-blue-50 flex items-center justify-center transition-colors cursor-pointer">
                    <i className="ri-map-pin-line text-blue-500 text-lg"></i>
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Character Counter */}
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        tweetText.length > 260 ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full ${
                          tweetText.length > 280
                            ? 'bg-red-500'
                            : tweetText.length > 260
                              ? 'bg-yellow-500'
                              : tweetText.length > 0
                                ? 'bg-blue-500'
                                : 'bg-gray-300'
                        }`}
                        style={{
                          transform: `scale(${Math.min(tweetText.length / 280, 1)})`,
                        }}
                      ></div>
                    </div>
                    {tweetText.length > 260 && (
                      <span
                        className={`text-sm ${tweetText.length > 280 ? 'text-red-500' : 'text-yellow-600'}`}
                      >
                        {280 - tweetText.length}
                      </span>
                    )}
                  </div>

                  {/* Tweet Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={!tweetText.trim() || tweetText.length > 280 || isSubmitting}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold px-6 py-2 rounded-full transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Tweeting...</span>
                      </div>
                    ) : (
                      'Tweet'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
