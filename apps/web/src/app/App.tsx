import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "../components/layout/AppShell";

const DashboardPage=lazy(()=>import("../features/dashboard/DashboardPage"));
const CTFArenaPage=lazy(()=>import("../features/ctf/CTFArenaPage"));
const AcademyPage=lazy(()=>import("../features/academy/AcademyPage"));
const CTFCategoryPage=lazy(()=>import("../features/ctf/CTFCategoryPage"));
const ChallengePage=lazy(()=>import("../features/ctf/ChallengePage"));
const LabsPage=lazy(()=>import("../features/labs/LabsPage"));
const AcademyCoursePage=lazy(()=>import("../features/academy/AcademyCoursePage"));
const AcademyLessonPage=lazy(()=>import("../features/academy/AcademyLessonPage"));
const PhishingHunterPage=lazy(()=>import("../features/academy/PhishingHunterPage"));
const TerminalSimulatorPage=lazy(()=>import("../features/labs/TerminalSimulatorPage"));
const LabWorkbenchPage=lazy(()=>import("../features/labs/LabWorkbenchPage"));
const AccountPage=lazy(()=>import("../features/auth/AccountPage"));
const OperationsPage=lazy(()=>import("../features/operations/OperationsPage"));
const CommunityPage=lazy(()=>import("../features/community/CommunityPage"));
const CommunityEventsPage=lazy(()=>import("../features/community/CommunityEventsPage"));
const ResearchPage=lazy(()=>import("../features/research/ResearchPage"));
const ProgressionPage=lazy(()=>import("../features/progression/ProgressionPage"));

function PageLoading(){return <section className="section-page"><div className="eyebrow">CYBERBREACH</div><p>Loading this learning area…</p></section>;}

export default function App(){
 return <Suspense fallback={<PageLoading/>}><Routes><Route element={<AppShell/>}>
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
  <Route path="labs/workbench" element={<LabWorkbenchPage/>}/>
  <Route path="progression" element={<ProgressionPage/>}/>
  <Route path="community" element={<CommunityPage/>}/>
  <Route path="community/events" element={<CommunityEventsPage/>}/>
  <Route path="research" element={<ResearchPage/>}/>
  <Route path="*" element={<Navigate to="/" replace/>}/>
 </Route></Routes></Suspense>;
}
