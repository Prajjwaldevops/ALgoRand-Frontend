import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel — BountyVault",
  description: "BountyVault platform administration dashboard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-vault-bg">
      {children}
    </div>
  );
}
