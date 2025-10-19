import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from '../common/Modal';
import TweetComposer from '../feed/TweetComposer';
import ReplyComposer from '../detail/ReplyComposer';
import {
  Bell,
  Home,
  List,
  Mail,
  MoreHorizontal,
  Search,
  Star,
  User,
  Users,
  Feather,
} from 'lucide-react';

interface SidebarLeftProps {
  onPost?: (content: string) => void;
  onReply?: (parentId: string, content: string) => void; // ✅ 추가
  parentId?: string; // ✅ TweetDetailPage에서 넘길 트윗 ID
  isReplyMode?: boolean;
}

const SidebarLeft = ({ onPost, onReply, parentId, isReplyMode = false }: SidebarLeftProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handlePost = (content: string) => {
    if (onPost) onPost(content);
    setIsModalOpen(false);
  };

  // const handleReply = (content: string) => {
  //   if (onReply && parentId) onReply(parentId, content)
  //   setIsModalOpen(false)
  // }

  const handleReply = (parentId: string, content: string) => {
    if (onReply) onReply(parentId, content);
    setIsModalOpen(false);
  };

  const menuItems = [
    { icon: Home, label: 'Home', path: '/social' },
    { icon: Search, label: 'Explore', path: '/social/explore' },
    { icon: Bell, label: 'Notifications', path: '/social/notifications' },
    { icon: Mail, label: 'Messages', path: '/social/messages' },
    { icon: List, label: 'Lists', path: '/social/lists' },
    { icon: Users, label: 'Communities', path: '/social/communities' },
    { icon: Star, label: 'Premium', path: '/social/premium' },
    { icon: User, label: 'Profile', path: '/social/profile' },
    { icon: MoreHorizontal, label: 'More', path: '/social/more' },
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col px-4 py-4 border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="mb-8 flex items-center justify-center">
        <Star className="w-8 h-8 text-primary" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {menuItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`flex items-center w-full px-3 py-3 rounded-full text-lg transition-colors ${
                isActive ? 'bg-gray-100 text-primary font-semibold' : 'hover:bg-gray-100'
              }`}
            >
              <Icon className="w-6 h-6 mr-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Post / Reply 버튼 */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 px-6 rounded-full w-full text-lg hover:bg-blue-600 transition-colors"
      >
        <Feather className="w-5 h-5" />
        {isReplyMode ? 'Reply' : 'Post'}
      </button>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="bg-white rounded-xl p-4 w-full max-w-xl mx-auto">
          {isReplyMode ? (
            // Reply 모드일 때 ReplyComposer 사용
            <ReplyComposer parentId={parentId || ''} onReply={handleReply} />
          ) : (
            <TweetComposer onPost={handlePost} />
          )}
        </div>
      </Modal>
    </aside>
  );
};

export default SidebarLeft;
