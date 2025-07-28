import { Routes, Route } from 'react-router-dom';
import Login from '../../pages/Login';
import Dashboard from '../../pages/Dashboard';
import Category from '../../pages/Category';
import ArticlePage from '../../pages/ArticlePage';
import ProtectedRoute from '../func/ProtectedRoute';

const AppRouter = () => (
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
  </Routes>
);

export default AppRouter;