export default function ProgressBar({ progress }) {
  return (
    <div style={{ width: '100%', background: '#1a1815', borderRadius: '9999px', height: '4px' }}>
      <div
        style={{
          width: `${progress}%`,
          height: '4px',
          borderRadius: '9999px',
          background: 'linear-gradient(90deg, #f07820, #ffa050)',
          transition: 'width 200ms',
          boxShadow: '0 0 6px rgba(240,120,32,0.5)',
        }}
      />
    </div>
  )
}
