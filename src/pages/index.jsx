import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import CreateQuest from "./CreateQuest";

import QuestLogs from "./QuestLogs";

import QuestDetail from "./QuestDetail";

import Community from "./Community";

import Workspace from "./Workspace";

import Settings from "./Settings";

import GuildDetail from "./GuildDetail";

import workspace from "./workspace";

import EditQuest from "./EditQuest";

import BugTracker from "./BugTracker";

import Login from "./Login";
import Signup from "./Signup";

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    CreateQuest: CreateQuest,
    
    QuestLogs: QuestLogs,
    
    QuestDetail: QuestDetail,
    
    Community: Community,
    
    Workspace: Workspace,
    
    Settings: Settings,
    
    GuildDetail: GuildDetail,
    
    workspace: workspace,
    
    EditQuest: EditQuest,

    BugTracker: BugTracker,

      Login: Login,
      Signup: Signup,

}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    const token = localStorage.getItem('googleIdToken');
    const localUser = localStorage.getItem('username');

      if (!token && !localUser && location.pathname !== '/login' && location.pathname !== '/signup') {
          return <Navigate to="/login" replace />;
      }

      if ((token || localUser) && (location.pathname === '/login' || location.pathname === '/signup')) {
          return <Navigate to="/Dashboard" replace />;
      }

      if (location.pathname === '/login') {
          return <Login />;
      }
      if (location.pathname === '/signup') {
          return <Signup />;
      }

    return (
        <Layout currentPageName={currentPage}>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/Dashboard" element={<Dashboard />} />
                <Route path="/CreateQuest" element={<CreateQuest />} />
                <Route path="/QuestLogs" element={<QuestLogs />} />
                <Route path="/QuestDetail" element={<QuestDetail />} />
                <Route path="/Community" element={<Community />} />
                <Route path="/Workspace" element={<Workspace />} />
                <Route path="/Settings" element={<Settings />} />
                <Route path="/GuildDetail" element={<GuildDetail />} />
                <Route path="/workspace" element={<workspace />} />
                <Route path="/EditQuest" element={<EditQuest />} />
                <Route path="/BugTracker" element={<BugTracker />} />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}