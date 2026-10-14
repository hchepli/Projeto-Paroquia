export default function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-6 md:px-17 ${className}`}>
      {children}
    </div>
  );
}