export default function EmptyState() {
  return (
    <div className="card text-center py-10">
      <div className="text-6xl mb-4">🏫</div>
      <h3 className="text-lg font-bold text-gray-700 mb-2">欢迎来到途途课堂</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-xs mx-auto">
        请先选择上方的年级，即可开始赛前练习！
      </p>
      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-xs">
        {[
          { emoji: '1️⃣', label: '选择年级', desc: '一至六年级' },
          { emoji: '2️⃣', label: '选择题型', desc: '六大题型' },
          { emoji: '3️⃣', label: '实时查看', desc: '流式答案' },
        ].map(item => (
          <div key={item.label} className="bg-amber-50 rounded-xl p-3">
            <div className="text-2xl mb-1">{item.emoji}</div>
            <div className="font-semibold text-amber-700">{item.label}</div>
            <div className="text-amber-500">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
