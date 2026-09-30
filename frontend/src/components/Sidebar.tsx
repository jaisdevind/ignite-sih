import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { name: 'Mission Dashboard', to: '/dashboard', icon: '📊' },
  { name: 'SRM Studio', to: '/srm-studio', icon: '🔬' },
  { name: 'Thermal Intelligence', to: '/thermal-intelligence', icon: '🌡️' },
  { name: 'Geospatial Risk Map', to: '/geospatial-risk', icon: '🗺️' },
  { name: 'Incident Analysis', to: '/incident-analysis', icon: '⚠️' },
  { name: 'Model / Pipeline', to: '/model-pipeline', icon: '⚙️' },
  { name: 'About', to: '/about', icon: 'ℹ️' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-gray-950 border-r border-gray-800 flex flex-col transition-all duration-200`}>
      <div className="p-3 flex items-center justify-between border-b border-gray-800">
        {!collapsed && <span className="font-bold text-sm tracking-widest text-primary">NAVIGATION</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="text-gray-500 hover:text-white text-lg">{collapsed ? '▶' : '◀'}</button>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary border-r-2 border-primary'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-800 text-[10px] text-gray-600 text-center">
        {!collapsed && 'IGNITE v0.1.0'}
      </div>
    </aside>
  );
}
