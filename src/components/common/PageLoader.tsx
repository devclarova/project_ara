export default function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background/50 backdrop-blur-sm fixed inset-0 z-[9999]">
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary shadow-[0_0_20px_rgba(var(--primary),0.3)]" />
        <div className="absolute inset-x-0 -bottom-8 text-center text-[10px] font-black tracking-[0.2em] text-primary/60 uppercase animate-pulse">
          Loading Data
        </div>
      </div>
    </div>
  );
}
