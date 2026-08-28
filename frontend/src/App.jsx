import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { RoadmapProvider } from './contexts/RoadmapContext';

// Layouts
import AppLayout from './layouts/AppLayout';

// Auth
import LoginPage from './modules/auth/LoginPage';
import SignupPage from './modules/auth/SignupPage';

// App pages
import DashboardPage from './modules/dashboard/DashboardPage';
import RoadmapPage from './modules/roadmap/RoadmapPage';
import RoadmapDayPage from './modules/roadmap/RoadmapDayPage';
import ResumeAnalyzerPage from './modules/resume/ResumeAnalyzerPage';
import StreakPage from './modules/streak/StreakPage';
import AptitudePage from './modules/aptitude/AptitudePage';
import SkillTwinPage from './modules/skillTwin/SkillTwinPage';
import JobsPage from './modules/jobs/JobsPage';
import JobDetailPage from './modules/jobs/JobDetailPage';
import CompanyProfilePage from './modules/jobs/CompanyProfilePage';
import CompaniesPage from './modules/companies/CompaniesPage';
import InternshipsPage from './modules/internships/InternshipsPage';
import ProgressPage from './modules/progress/ProgressPage';
import InterviewPrepPage from './modules/interview/InterviewPrepPage';
import ProfilePage from './modules/profile/ProfilePage';

// Placeholder pages for not-yet-built modules
import PlaceholderPage from './modules/shared/PlaceholderPage';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <RoadmapProvider>
            <BrowserRouter>
              <Routes>
                {/* Public */}
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

                {/* Protected — with sidebar layout */}
                <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="roadmap" element={<RoadmapPage />} />
                  <Route path="roadmap/day/:dayId" element={<RoadmapDayPage />} />
                  <Route path="resume" element={<ResumeAnalyzerPage />} />
                  <Route path="streak" element={<StreakPage />} />
                  <Route path="aptitude" element={<AptitudePage />} />
                  <Route path="skill-twin" element={<SkillTwinPage />} />
                  <Route path="jobs" element={<JobsPage />} />
                  <Route path="jobs/:id" element={<JobDetailPage />} />
                  <Route path="companies" element={<CompaniesPage />} />
                  <Route path="companies/:id" element={<CompanyProfilePage />} />
                  <Route path="internships" element={<InternshipsPage />} />
                  <Route path="progress" element={<ProgressPage />} />
                  <Route path="interview" element={<InterviewPrepPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="chatbot" element={<PlaceholderPage title="AI Career Coach" />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </RoadmapProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
