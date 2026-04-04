type AvatarSize = 'sm' | 'md' | 'lg';

const sizes: Record<AvatarSize, { width: string; height: string; fontSize: string }> = {
  sm: { width: '22px', height: '22px', fontSize: '11px' },
  md: { width: '34px', height: '34px', fontSize: '14px' },
  lg: { width: '48px', height: '48px', fontSize: '20px' },
};

type AvatarProps = {
  name: string;
  size?: AvatarSize;
};

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const { width, height, fontSize } = sizes[size];
  return (
    <div
      style={{
        width,
        height,
        fontSize,
        background: 'linear-gradient(135deg, #10b981, #3b82f6)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
