export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login page has its own layout without the sidebar
  return <>{children}</>;
}
