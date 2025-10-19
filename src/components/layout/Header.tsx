interface HeaderProps {
  title: string;
}
const Header = ({ title }: HeaderProps) => {
  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3">
      <h1 className="text-xl font-bold">{title}</h1>
    </header>
  );
};

export default Header;
