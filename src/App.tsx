import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AgentList from "@/pages/AgentList";
import CreateAgent from "@/pages/CreateAgent";
import EditAgent from "@/pages/EditAgent";
import AgentDetail from "@/pages/AgentDetail";
import DeploymentStatus from "@/pages/DeploymentStatus";
import Connectors from "@/pages/Connectors";
import PlatformSettings from "@/pages/PlatformSettings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="agents" element={<AgentList />} />
            <Route path="agents/new" element={<CreateAgent />} />
            <Route path="agents/:agentId" element={<AgentDetail />} />
            <Route path="agents/:agentId/edit" element={<EditAgent />} />
            <Route path="deployments" element={<DeploymentStatus />} />
            <Route
              path="deployments/:deploymentId"
              element={<DeploymentStatus />}
            />
            <Route path="connectors" element={<Connectors />} />
            <Route path="settings" element={<PlatformSettings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
