import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Map, TrendingUp, Briefcase, Building2,
  Brain, Target, MessageCircle, BookOpen, User, ChevronLeft, Menu, Flame, FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/roadmap',     icon: Map,             label: 'My Roadmap'    },
  { to: '/streak',      icon: Flame,           label: 'Streak'        },
  { to: '/resume',      icon: FileText,        label: 'Resume ATS'    },
  { to: '/skill-twin',  icon: Brain,           label: 'Skill Twin'    },
  { to: '/aptitude',    icon: Target,          label: 'Aptitude'      },
  { to: '/jobs',        icon: Briefcase,       label: 'Jobs'          },
  { to: '/companies',   icon: Building2,       label: 'Companies'     },
  { to: '/internships', icon: BookOpen,        label: 'Internships'   },
  { to: '/progress',    icon: TrendingUp,      label: 'Progress'      },
  { to: '/interview',   icon: BookOpen,        label: 'Interview Prep'},
  { to: '/profile',     icon: User,            label: 'Profile'       },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out
        bg-surface border-r border-border
        ${collapsed ? 'w-[68px]' : 'w-[220px]'}`}
    >
      {/* Logo + Hamburger */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-border">
        {!collapsed && (
          <span className="text-text font-bold text-base tracking-tight">
            Place<span className="text-accent-blue">Mate</span> AI
          </span>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="p-1.5 rounded-lg hover:bg-card text-muted hover:text-text transition-colors"
          aria-label="Toggle sidebar"
          id="sidebar-toggle"
        >
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* User Role Pill */}
      {!collapsed && user && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-accent-blue/20 flex items-center justify-center">
              <User size={13} className="text-accent-blue" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-text leading-none">{user.name}</p>
              <p className="text-[10px] text-muted mt-0.5">{user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-2 no-scrollbar">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3.5 py-2.5 mx-2.5 rounded-xl my-0.5 text-[13px] font-medium transition-all duration-150
               ${isActive
                 ? 'bg-[#161f33] text-white shadow-sm border border-accent-blue/20 font-semibold'
                 : 'text-muted hover:bg-card/70 hover:text-text'
               }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active left accent bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-accent-blue rounded-r-full shadow-glow" />
                )}
                <Icon size={16} className={`flex-shrink-0 ${isActive ? 'text-accent-blue' : ''}`} />
                {!collapsed && <span className="truncate">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: Logout */}
      <div className="px-2 py-4 border-t border-border">
        <button
          onClick={handleLogout}
          id="sidebar-logout"
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted hover:text-accent-red hover:bg-accent-red/10 text-[13px] font-medium transition-colors"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
}
