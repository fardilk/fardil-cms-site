import { Routes, Route } from 'react-router-dom';
import Login from '../../pages/Login';
import Dashboard from '../../pages/Dashboard';
import Category from '../../pages/Category';
import ArticlePage from '../../pages/ArticlePage';
import ArtikelEditor from '@/pages/ArtikelEditor';
import ProtectedRoute from '../func/ProtectedRoute';
import Preview from '@/pages/Preview';
import Media from '@/pages/Media';
import Leads from '@/pages/Leads';
import Registrations from '@/pages/Registrations';
import Layanan from '@/pages/Layanan';
import LayananEditor from '@/pages/LayananEditor';
import NotFound from '@/pages/NotFound';

const AppRouter = () => (
  <>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/category"
        element={
          <ProtectedRoute>
            <Category />
          </ProtectedRoute>
        }
      />
      <Route
        path="/artikel"
        element={
          <ProtectedRoute>
            <ArticlePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/artikel/baru"
        element={
          <ProtectedRoute>
            <ArtikelEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/artikel/:id"
        element={
          <ProtectedRoute>
            <ArtikelEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/preview/:id"
        element={
          <ProtectedRoute>
            <Preview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/halaman"
        element={
          <ProtectedRoute>
            <Layanan />
          </ProtectedRoute>
        }
      />
      <Route
        path="/halaman/:id"
        element={
          <ProtectedRoute>
            <LayananEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/media"
        element={
          <ProtectedRoute>
            <Media />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pesan"
        element={
          <ProtectedRoute>
            <Leads />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transaksi/permintaan"
        element={
          <ProtectedRoute>
            <Registrations stage="permintaan" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transaksi/peserta"
        element={
          <ProtectedRoute>
            <Registrations stage="peserta" />
          </ProtectedRoute>
        }
      />
      {/* Catch-all: an unmatched path used to render nothing, which is
          indistinguishable from a crash. */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);

export default AppRouter;