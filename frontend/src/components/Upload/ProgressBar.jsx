export default function ProgressBar({ progress }) {
  return (
    <div style={{ width: '100%', background: '#e8e5e0', borderRadius: '9999px', height: '6px' }}>
      <div
        style={{
          width: `${progress}%`,
          height: '6px',
          borderRadius: '9999px',
          background: '#d6a96a',
          transition: 'width 200ms',
        }}
      />
    </div>
  )
}
