import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import DashboardPage from "../features/dashboard/DashboardPage";
import SectionPage from "../features/placeholder/SectionPage";
import CTFArenaPage from "../features/ctf/CTFArenaPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="academy" element={<SectionPage title="Cyber Academy" eyebrow="LEARN" description="Build your skills through clear lessons, guided practice and knowledge checks." />} />
        <Route path="operations" element={<SectionPage title="Operations" eyebrow="PRACTICE" description="Investigate realistic, fictional security scenarios in a safe training environment." />} />
        <Route path="ctf" element={<CTFArenaPage />} />
        <Route path="ctf/:category" element={<SectionPage title="CTF Category" eyebrow="CHALLENGE CATEGORY" description="Category challenge listings, prerequisites, hints and walkthroughs will be added as the challenge engine is implemented." />} />
        <Route path="labs" element={<SectionPage title="Cyber Labs" eyebrow="HANDS-ON" description="Practice in purpose-built environments. Live untrusted-code execution is not enabled in this foundation build." />} />
        <Route path="community" element={<SectionPage title="Community" eyebrow="CONNECT" description="Find teammates, share learning progress and take part in events." />} />
        <Route path="research" element={<SectionPage title="AI Security Research" eyebrow="EXPLORE" description="Study LLM security, AI agent risks and adversarial machine learning." />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
