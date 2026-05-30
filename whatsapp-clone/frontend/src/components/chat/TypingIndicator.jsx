// TypingIndicator.jsx
export function TypingIndicator({ names }) {
  const label = names.length === 1
    ? `${names[0]} is typing`
    : `${names.slice(0, 2).join(', ')} are typing`

  return (
    <div className="flex items-center gap-2 px-3 py-2 w-fit">
      <div className="flex gap-1 bg-white dark:bg-gray-700 rounded-2xl px-3 py-2 shadow-sm">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
      <span className="text-xs text-gray-400 italic">{label}</span>
    </div>
  )
}

export default TypingIndicator
