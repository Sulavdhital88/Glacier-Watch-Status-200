import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Radio, Cpu, Image as ImageIcon, Sliders, Shield, Bot } from 'lucide-react';

export function Sidebar() {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/agent', label: 'Glacier Agent', icon: Bot },
    { to: '/sensors', label: 'Sensors', icon: Cpu },
    { to: '/images', label: 'Images', icon: ImageIcon },
  ];

  const secondaryItems = [
    { to: '/settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <aside className="w-60 bg-cardWarm border-r border-borderWarm flex flex-col justify-between select-none min-h-screen">
      <div>
        {/* Brand Wordmark */}
        <div className="p-6 border-b border-borderWarm">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-accentRed flex items-center justify-center text-white shadow-sm font-bold text-sm">
              GW
            </div>
            <div>
              <h1 className="font-sans font-bold text-base tracking-wider text-textDark uppercase">
                GLACIERWATCH
              </h1>
              <p className="text-[11px] text-textMuted tracking-tight">
                Early Warning System
              </p>
            </div>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-lightRed text-accentRed font-semibold'
                    : 'text-textDark hover:bg-bgCream hover:text-textDark'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Divider */}
          <div className="pt-4 pb-2">
            <div className="border-t border-borderWarm" />
            <span className="text-[10px] font-mono text-textMuted/70 uppercase tracking-wider px-3 pt-3 block">
              System
            </span>
          </div>

          {secondaryItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-lightRed text-accentRed font-semibold'
                    : 'text-textDark hover:bg-bgCream hover:text-textDark'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 m-4 border border-borderWarm rounded-lg bg-bgCream/50 text-[11px] text-textMuted">
        <div className="flex items-center space-x-1.5 font-medium text-textDark mb-1">
          <Shield className="w-3.5 h-3.5 text-accentSuccess" />
          <span>Operator Console</span>
        </div>
        <p className="leading-snug">
          Station GW-001 • Rasuwa, Nepal
        </p>
      </div>
    </aside>
  );
}
export default Sidebar;
