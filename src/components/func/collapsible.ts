import { useState } from 'react';

export function useCollapsibleSidebar(defaultCollapsed = false) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const toggleCollapsed = () => setCollapsed(c => !c);

  return { collapsed, toggleCollapsed };
}