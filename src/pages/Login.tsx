import React, { useState } from 'react';
import { useLoginHandler } from '../components/func/useLoginHandler';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { handleSubmit, loading } = useLoginHandler();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--p-bg)] px-4">
      <div className="p-card flex w-full max-w-sm flex-col items-center gap-6 px-6 py-8">
        <div className="w-full">
          <h2 className="text-center text-lg font-semibold text-[var(--p-text)]">
            Sign in to your account
          </h2>
          <p className="mt-1 text-center text-[0.8125rem] text-[var(--p-text-secondary)]">
            Enter your credentials to access the dashboard
          </p>
        </div>
        <form className="w-full space-y-4" onSubmit={e => handleSubmit(e, username, password)}>
          <div className="space-y-3">
            <div>
              <label htmlFor="username" className="p-label">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="p-field"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="p-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="p-field"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </a>
            </div>
          </div>

          {loading && (
            <div className="flex justify-center my-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#303030] px-3 py-2 text-[0.8125rem] font-medium text-white transition-colors hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;