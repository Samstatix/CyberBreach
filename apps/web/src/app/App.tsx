import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import DashboardPage from "../features/dashboard/DashboardPage";
import CTFArenaPage from "../features/ctf/CTFArenaPage";
import AcademyPage from "../features/academy/AcademyPage";
import CTFCategoryPage from "../features/ctf/CTFCategoryPage";
import ChallengePage from "../features/ctf/ChallengePage";
import LabsPage from "../features/labs/LabsPage";
import AcademyCoursePage from "../features/academy/AcademyCoursePage";
import AcademyLessonPage from "../features/academy/AcademyLessonPage";
import PhishingHunterPage from "../features/academy/PhishingHunterPage";
import TerminalSimulatorPage from "../features/labs/TerminalSimulatorPage";
import AccountPage from "../features/auth/AccountPage";
import OperationsPage from "../features/operations/OperationsPage";
import CommunityPage from "../features/community/CommunityPage";
import ResearchPage from "../features/research/ResearchPage";

export default function App(){
 return <Routes><Route element={<AppShell/>}>
  <Route index element={<DashboardPage/>}/>
  <Route path="account" element={<AccountPage/>}/>
  <Route path="academy" element={<AcademyPage/>}/>
  <Route path="academy/courses/:courseId" element={<AcademyCoursePage/>}/>
  <Route path="academy/lessons/:lessonId" element={<AcademyLessonPage/>}/>
  <Route path="academy/phishing-hunter" element={<PhishingHunterPage/>}/>
  <Route path="operations" element={<OperationsPage/>}/>
  <Route path="ctf" element={<CTFArenaPage/>}/>
  <Route path="ctf/challenge/:slug" element={<ChallengePage/>}/>
  <Route path="ctf/:category" element={<CTFCategoryPage/>}/>
  <Route path="labs" element={<LabsPage/>}/>
  <Route path="labs/linux-terminal" element={<TerminalSimulatorPage/>}/>
  <Route path="community" element={<CommunityPage/>}/>
  <Route path="research" element={<ResearchPage/>}/>
  <Route path="*" element={<Navigate to="/" replace/>}/>
 </Route></Routes>;
}
