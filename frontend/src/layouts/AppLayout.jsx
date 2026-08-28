import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../shared/components/Sidebar';
import TopBar from '../shared/components/TopBar';
import ChatbotWidget from '../shared/components/ChatbotWidget';

const SIDEBAR_EXPANDED  = 220;
const SIDEBAR_COLLAPSED = 68;

/**
 * AppLayout — wraps all authenticated routes with Sidebar + TopBar.
 * Content area adjusts left margin based on sidebar state.
 */
export default function AppLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_EXPANDED);

  return (
    <div className="min-h-screen bg-bg">
      {/* Sidebar listens to its own toggle internally */}
      <Sidebar />

      {/* Top bar */}
      <TopBar sidebarWidth={sidebarWidth} />

      {/* Page content */}
      <main
        className="transition-all duration-300 pt-14 min-h-screen"
        style={{ marginLeft: SIDEBAR_EXPANDED }}
        id="main-content"
      >
        <div className="p-6 max-w-[1400px]">
          <Outlet />
        </div>
      </main>

      {/* Floating AI Career Coach Chatbot */}
      <ChatbotWidget />
    </div>
  );
}
