import { useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import { login as authLogin } from '../store/authSlice';
import { Button, Input, Logo } from './index';
import { useDispatch } from 'react-redux';
import authService from '../appwrite/auth';
import { useForm } from 'react-hook-form';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const handleLogin = async (data) => {
    setError('');
    setLoading(true);
    try {
      const session = await authService.login(data);
      if (session) {
        const userData = await authService.getCurrentUser();
        if (userData) {
          dispatch(authLogin(userData));
        }
        navigate("/");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError(err?.message || "Invalid credentials. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex items-center justify-center w-full py-8'>
      <div className='w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl shadow-slate-200/50'>
        <div className='mb-6 flex justify-center'>
          <Logo width="160px" />
        </div>
        
        <h2 className='text-center text-2xl font-extrabold text-slate-900 tracking-tight'>
          Welcome back
        </h2>
        <p className='mt-2 text-center text-sm text-slate-600'>
          Don't have an account?{' '}
          <Link to="/signup" className='font-semibold text-indigo-600 hover:text-indigo-500 transition-colors'>
            Create one for free
          </Link>
        </p>

        {error && (
          <div className='mt-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2'>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(handleLogin)} className='mt-6 space-y-4'>
          <Input
            label="Email address"
            placeholder="you@example.com"
            type="email"
            error={errors.email?.message}
            {...register("email", {
              required: "Email is required",
              validate: {
                matchPattern: (value) =>
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || "Please enter a valid email address",
              },
            })}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password", {
              required: "Password is required",
            })}
          />

          <div className="pt-2">
            <Button
              type="submit"
              loading={loading}
              className="w-full py-3 text-sm font-semibold shadow-md"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;