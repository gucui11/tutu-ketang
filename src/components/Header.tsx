export default function Header() {
  return (
    <header className="z-40 backdrop-blur-md bg-white/70 border-0">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between py-2 gap-4">
          {/* 左侧：标题 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl">📚</span>
            <h1 className="text-lg font-bold text-amber-700 tracking-tight whitespace-nowrap">
              途途课堂赛前练习平台
            </h1>
          </div>

          {/* 右侧：Logo */}
          <img
            src={import.meta.env.BASE_URL + 'tutu-logo.png'}
            alt="途途课堂"
            className="h-auto object-contain opacity-90 flex-shrink-0"
            style={{ maxWidth: '36%' }}
          />
        </div>

        {/* 底部分隔线 */}
        <div className="border-b-2 border-amber-100 -mb-2px" />
      </div>
    </header>
  );
}
