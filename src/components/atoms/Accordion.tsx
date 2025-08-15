import React from 'react';

type AccordionSectionProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

const AccordionSection: React.FC<AccordionSectionProps> = ({ title, open, onToggle, children }) => (
  <div className="border rounded-lg overflow-hidden">
    <button className="w-full flex justify-between items-center px-3 py-2 bg-gray-50 hover:bg-gray-100" onClick={onToggle}>
      <span className="text-sm font-semibold">{title}</span>
      <i className={`fas fa-chevron-${open ? 'up' : 'down'} text-xs text-gray-500`}></i>
    </button>
    {open && (
      <div className="p-3 flex flex-col gap-3 bg-white">{children}</div>
    )}
  </div>
);

export default AccordionSection;
