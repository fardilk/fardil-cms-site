import { Link } from 'react-router-dom';
import GlobalLayout from '../components/layout/GlobalLayout';
import Card from '../components/ui/Card';

/**
 * Without a catch-all route an unknown path rendered nothing at all, which
 * looks identical to a JavaScript failure. Anything unmatched lands here.
 */
const NotFound = () => (
  <GlobalLayout>
    <Card>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <i className="fa fa-compass mb-4 text-4xl text-[var(--p-text-disabled)]" aria-hidden="true" />
        <h1 className="mb-1 text-base font-semibold text-[var(--p-text)]">Halaman tidak ditemukan</h1>
        <p className="mb-5 text-[0.8125rem] text-[var(--p-text-secondary)]">
          Alamat yang Anda buka tidak ada di panel ini.
        </p>
        <Link
          to="/dashboard"
          className="rounded-lg bg-[#303030] px-3 py-1.5 text-[0.8125rem] font-medium text-white hover:bg-[#1a1a1a]"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </Card>
  </GlobalLayout>
);

export default NotFound;
