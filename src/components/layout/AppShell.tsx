import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { UndoToastContainer } from "@/components/common/UndoToastContainer";

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
      <UndoToastContainer />
    </div>
  );
}
