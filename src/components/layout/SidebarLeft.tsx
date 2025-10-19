import { useState } from 'react';
import Modal from '../common/Modal';
import TweetComposer from '../feed/TweetComposer';
import { Bell, Home, List, Mail, MoreHorizontal, Search, Star, User, Users } from 'lucide-react';

const SidebarLeft = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col px-4 py-4 border-r border-gray-200">
      {/* Logo */}
      <div className="mb-8 flex items-center justify-center">
        <Star className="w-8 h-8 text-primary" />
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 space-y-2">
        {[
          { icon: Home, label: 'Home' },
          { icon: Search, label: 'Explore' },
          { icon: Bell, label: 'Notifications' },
          { icon: Mail, label: 'Messages' },
          { icon: List, label: 'Lists' },
          { icon: Users, label: 'Communities' },
          { icon: Star, label: 'Premium' },
          { icon: User, label: 'Profile' },
          { icon: MoreHorizontal, label: 'More' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex items-center w-full px-3 py-3 rounded-full text-lg hover:bg-gray-100 transition-colors"
          >
            <Icon className="w-6 h-6 mr-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* Post Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-primary text-white font-bold py-3 px-8 rounded-[8px] w-full text-lg hover:bg-blue-600 transition-colors"
      >
        Post
      </button>

      {/* Tweet Composer Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <TweetComposer />
      </Modal>
    </aside>
  );
};

export default SidebarLeft;
