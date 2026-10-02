import { useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import { login } from '../store/authSlice';
import { Button, Input, Logo } from './index';
import { useDispatch } from 'react-redux';
import authService from '../appwrite/auth';
import { useForm } from 'react-hook-form';

const Signup = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { register, handleSubmit, formState: { errors } } = useForm();

    const create = async (data) => {
        setError('');
        setLoading(true);
        try {
            const user = await authService.createAccount(data);
            if (user) {
                const currentUser = await authService.getCurrentUser();
                if (currentUser) {
                    dispatch(login(currentUser));
                }
                navigate("/");
            }
        } catch (err) {
            console.error("Signup failed:", err);
            setError(err?.message || "Failed to create account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='flex items-center justify-center w-full py-8'>
            <div className='auth-card w-full max-w-md bg-white dark:bg-[#2E073F] rounded-3xl p-8 sm:p-10 border border-slate-200/90 dark:border-[#7A1CAC]/40 shadow-xl shadow-slate-200/50 dark:shadow-[#2E073F]/70'>
                <div className='mb-6 flex justify-center'>
                    <Logo width="160px" />
                </div>
                
                <h2 className='text-center text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight'>
                    Create your account
                </h2>
                <p className='mt-2 text-center text-sm text-slate-600 dark:text-[#EBD3F8]/70'>
                    Already have an account?{' '}
                    <Link to="/login" className='font-semibold text-[#1D4ED8] hover:text-[#3B82F6] dark:text-[#AD49E1] dark:hover:text-[#EBD3F8] transition-colors'>
                        Sign In
                    </Link>
                </p>

                {error && (
                    <div className='mt-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2'>
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit(create)} className='mt-6 space-y-4'>
                    <Input
                        label="Full Name"
                        placeholder="John Doe"
                        type="text"
                        error={errors.name?.message}
                        {...register("name", {
                            required: "Full name is required",
                        })}
                    />

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
                            minLength: {
                                value: 8,
                                message: "Password must be at least 8 characters",
                            },
                        })}
                    />

                    <div className="pt-2">
                        <Button
                            type="submit"
                            loading={loading}
                            className="w-full py-3 text-sm font-semibold shadow-md"
                        >
                            {loading ? "Creating account..." : "Create Account"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;