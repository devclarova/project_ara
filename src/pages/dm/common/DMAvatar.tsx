// 아바타+배지(읽지않음)
type Props = {
  name: string;
  src?: string;
  size?: number; // px
  unread?: number;
};

const DMAvatar: React.FC<Props> = ({ name, src, size = 50, unread = 0 }) => {
  return (
    <div className="relative mr-4">
      <img
        src={src ?? `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`}
        alt={name}
        className="rounded-full object-cover border-2 border-[#f0f0f0]"
        style={{ width: size, height: size }}
      />
      {unread > 0 && (
        <div className="absolute -top-[2px] -right-[2px] bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[12px] font-semibold">
          {unread}
        </div>
      )}
    </div>
  );
};

export default DMAvatar;
