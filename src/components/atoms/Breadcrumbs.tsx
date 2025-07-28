import React from "react";
import { Link, useLocation } from "react-router-dom";

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // If the first segment is 'dashboard', treat it as Home and do not show 'Home / Home'.
  const isDashboardHome = pathnames[0]?.toLowerCase() === 'dashboard';
  const filteredPathnames = isDashboardHome ? pathnames.slice(1) : pathnames;
  const homeLink = isDashboardHome ? '/dashboard' : '/';

  return (
    <nav className="text-sm mb-4" aria-label="Breadcrumb">
      <ol className="list-none p-0 inline-flex">
        <li>
          <Link to={homeLink} className="text-gray-400 hover:underline font-normal">
            Home
          </Link>
        </li>
        {filteredPathnames.map((value, index) => {
          const to =
            homeLink +
            (homeLink.endsWith('/') ? '' : '/') +
            filteredPathnames.slice(0, index + 1).join('/');
          const isLast = index === filteredPathnames.length - 1;
          const label = decodeURIComponent(value.charAt(0).toUpperCase() + value.slice(1));
          return (
            <li key={to} className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              {isLast ? (
                <span className="text-gray-700 font-semibold capitalize">{label}</span>
              ) : (
                <Link to={to} className="text-blue-700 hover:underline capitalize">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
