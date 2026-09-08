import React from 'react';
import { useApp, AppTab } from '../../context/AppContext';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  tab?: AppTab;
}

interface BreadcrumbProps {
  title: string;
  items: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ title, items, actions }) => {
  const { setActiveTab } = useApp();

  return (
    <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
        <nav className="flex items-center text-xs text-slate-500 mt-1 space-x-1">
          <button
            onClick={() => setActiveTab('panel')}
            className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Inicio</span>
          </button>
          {items.map((it, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              {it.tab ? (
                <button
                  onClick={() => it.tab && setActiveTab(it.tab)}
                  className="hover:text-blue-600 transition-colors cursor-pointer font-medium"
                >
                  {it.label}
                </button>
              ) : (
                <span className="text-slate-700 font-semibold">{it.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
};
