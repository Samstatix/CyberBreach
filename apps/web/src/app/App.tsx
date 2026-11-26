import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import DashboardPage from "../features/dashboard/DashboardPage";
import SectionPage from "../features/placeholder/SectionPage";
import CTFArenaPage from "../features/ctf/CTFArenaPage";
import AcademyPage from "../features/academy/AcademyPage";
import CTFCategoryPage from "../features/ctf/CTFCategoryPage";
import LabsPage from "../features/labs/LabsPage";
import AcademyCoursePage from "../features/academy/AcademyCoursePage";
import AcademyLessonPage from "../features/academy/AcademyLessonPage";
import PhishingHunterPage from "../features/academy/PhishingHunterPage";
import TerminalSimulatorPage from "../features/labs/TerminalSimulatorPage";
import AccountPage from "../features/auth/AccountPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />\n        <Route path="account" element={<AccountPage />} />
        <Route path="academy" element={<AcademyPage />} />
        <Route path="academy/courses/:courseId" element={<AcademyCoursePage />} />
        <Route path="academy/lessons/:lessonId" element={<AcademyLessonPage />} />
        <Route path="academy/phishing-hunter" element={<PhishingHunterPage />} />
        <Route path="operations" element={<SectionPage title="Operations" eyebrow="PRACTICE" description="Investigate realistic, fictional security scenarios in a safe training environment." />} />
        <Route path="ctf" element={<CTFArenaPage />} />
        <Route path="ctf/:category" element={<CTFCategoryPage />} />
        <Route path="labs" element={<LabsPage />} />
        <Route path="labs/linux-terminal" element={<TerminalSimulatorPage />} />
        <Route path="community" element={<SectionPage title="Community" eyebrow="CONNECT" description="Find teammates, share learning progress and take part in events." />} />
        <Route path="research" element={<SectionPage title="AI Security Research" eyebrow="EXPLORE" description="Study LLM security, AI agent risks and adversarial machine learning." />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
