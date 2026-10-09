import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardShell from "./components/layout/DashboardShell";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CandidateDashboard from "./pages/CandidateDashboard";
import Profile from "./pages/Profile";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Interview from "./pages/Interview";
import InterviewComplete from "./pages/InterviewComplete";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoles from "./pages/AdminRoles";
import AdminRoleForm from "./pages/AdminRoleForm";
import AdminCandidates from "./pages/AdminCandidates";
import CandidateReport from "./pages/CandidateReport";
import NotFound from "./pages/NotFound";

function Page({ children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <ErrorBoundary>
      <Toaster position="top-center" />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Page><Landing /></Page>} />
          <Route path="/login" element={<Page><Login /></Page>} />
          <Route path="/register" element={<Page><Register /></Page>} />
          <Route path="/jobs" element={<Page><Jobs /></Page>} />
          <Route path="/jobs/:id" element={<Page><JobDetail /></Page>} />

          <Route
            path="/app"
            element={
              <ProtectedRoute role="candidate">
                <DashboardShell mode="candidate" />
              </ProtectedRoute>
            }
          >
            <Route index element={<CandidateDashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="complete/:applicationId" element={<InterviewComplete />} />
          </Route>
          <Route
            path="/app/interview/:applicationId"
            element={
              <ProtectedRoute role="candidate">
                <Interview />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <DashboardShell mode="admin" />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="roles" element={<AdminRoles />} />
            <Route path="roles/new" element={<AdminRoleForm />} />
            <Route path="roles/:id" element={<AdminRoleForm />} />
            <Route path="candidates" element={<AdminCandidates />} />
            <Route path="candidates/:interviewId" element={<CandidateReport />} />
          </Route>

          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  );
}
