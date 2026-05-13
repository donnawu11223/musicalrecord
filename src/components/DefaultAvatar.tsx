interface DefaultAvatarProps {
  size?: number
  style?: React.CSSProperties
}

export default function DefaultAvatar({ size = 100, style }: DefaultAvatarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ backgroundColor: '#e3e2e0', ...style }}
    >
      {/* 背景圆 */}
      <circle cx="50" cy="50" r="50" fill="#e3e2e0" />
      {/* 头部 */}
      <circle cx="50" cy="36" r="16" fill="#c0c8c8" />
      {/* 身体 */}
      <ellipse cx="50" cy="78" rx="26" ry="22" fill="#c0c8c8" />
    </svg>
  )
}
