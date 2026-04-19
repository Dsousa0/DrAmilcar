export default function ProgressBar({ progress }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-blue-500 h-2 rounded-full transition-all duration-200"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
