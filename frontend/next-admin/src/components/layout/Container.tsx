export default function Container({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        paddingLeft: 32,
        paddingRight: 64,
        ...style,
      }}
    >
      {children}
    </div>
  );
}