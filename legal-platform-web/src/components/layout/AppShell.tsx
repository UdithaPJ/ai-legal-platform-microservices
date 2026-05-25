import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

type Role = "CLIENT" | "LAWYER" | "ADMIN";

export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
}
