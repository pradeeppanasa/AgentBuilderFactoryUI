import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminRoute } from "@/components/layout/AdminRoute";
import Login from "@/pages/Login";
import Forbidden from "@/pages/Forbidden";
import ObservabilitySettings from "@/pages/ObservabilitySettings";
import Dashboard from "@/pages/Dashboard";
import AgentList from "@/pages/AgentList";
import CreateAgent from "@/pages/CreateAgent";
import EditAgent from "@/pages/EditAgent";
import AgentDetail from "@/pages/AgentDetail";
import DeploymentStatus from "@/pages/DeploymentStatus";
import Connectors from "@/pages/Connectors";
import KnowledgeBases from "@/pages/KnowledgeBases";
import GuardrailPolicies from "@/pages/GuardrailPolicies";
import GuardrailPolicyEditor from "@/pages/GuardrailPolicyEditor";
import PlatformSettings from "@/pages/PlatformSettings";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Skills from "@/pages/Skills";
import ModelCatalog from "@/pages/ModelCatalog";
import HitlReviews from "@/pages/HitlReviews";
import AgentWizard from "@/pages/AgentWizard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:projectId" element={<ProjectDetail />} />
            <Route path="projects/:projectId/agents/new" element={<AgentWizard />} />
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
            <Route path="platform/knowledge-bases" element={<KnowledgeBases />} />
            <Route path="platform/guardrail-policies" element={<GuardrailPolicies />} />
            <Route path="platform/guardrail-policies/new" element={<GuardrailPolicyEditor />} />
            <Route
              path="platform/guardrail-policies/:policyId"
              element={<GuardrailPolicyEditor />}
            />
            <Route
              path="platform/guardrail-policies/:policyId/edit"
              element={<GuardrailPolicyEditor />}
            />
            <Route path="platform/skills" element={<Skills />} />
            <Route path="hitl-reviews" element={<HitlReviews />} />
            <Route path="settings" element={<PlatformSettings />} />
            <Route path="403" element={<Forbidden />} />
            <Route element={<AdminRoute />}>
              <Route path="admin/observability" element={<ObservabilitySettings />} />
              <Route path="platform/models" element={<ModelCatalog />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
