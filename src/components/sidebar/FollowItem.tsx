import { useFollow } from '../../hooks/useFollow';

interface FollowItemProps {
  name: string;
  handle: string;
  avatar: string;
}
const FollowItem = ({ name, handle, avatar }: FollowItemProps) => {
  const { isFollowing, toggleFollow } = useFollow(handle);
  return (
    <div className="follow-item flex items-center justify-between p-2 rounded transition-colors hover:bg-gray-100">
      <div className="flex items-center space-x-3">
        <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
        <div>
          <p className="font-bold text-sm">{name}</p>
          {/* <p className="text-secondary text-sm">@{handle}</p> */}
        </div>
      </div>

      <button
        onClick={toggleFollow}
        className={`text-sm font-bold px-4 py-1.5 rounded-button whitespace-nowrap transition-colors ${
          isFollowing
            ? 'bg-gray-200 text-black hover:bg-red-100 hover:text-red-600'
            : 'bg-black text-white hover:bg-gray-800'
        }`}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </button>
    </div>
  );
};

export default FollowItem;
