import { Link } from 'react-router-dom';
import GlobalLayout from '../components/layout/GlobalLayout';

/**
 * Without a catch-all route an unknown path rendered nothing at all, which
 * looks identical to a JavaScript failure. Anything unmatched lands here.
 */
const NotFound = () => (
  <GlobalLayout>
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <i className="fa fa-compass text-5xl text-gray-300 mb-4" aria-hidden="true" />
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">Halaman tidak ditemukan</h1>
      <p className="text-gray-500 mb-6">Alamat yang Anda buka tidak ada di panel ini.</p>
      <Link to="/dashboard" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
        Kembali ke Dashboard
      </Link>
    </div>
  </GlobalLayout>
);

export default NotFound;
