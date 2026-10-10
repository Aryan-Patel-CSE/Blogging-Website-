import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../store/authSlice';
import { Input, Logo } from './index';
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
        <div className="flex items-center justify-center w-full py-12 px-4">
            <div className="auth-card w-full max-w-md neu-card p-8 sm:p-10 border border-slate-200/50 dark:border-white/5">
                <div className="mb-6 flex justify-center">
                    <Logo width="160px" />
                </div>
                
                <h2 className="text-center text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
                    Already have an account?{' '}
                    <Link to="/login" className="font-bold text-[#FF6B00] hover:text-[#FF7F1F] dark:text-[#FF7A18] dark:hover:text-[#FF8F33] transition-colors">
                        Sign In
                    </Link>
                </p>

                {error && (
                    <div className="mt-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit(create)} className="mt-6 space-y-4">
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
                        <button
                            type="submit"
                            disabled={loading}
                            className="neu-btn-primary w-full py-3.5 text-sm font-bold rounded-2xl shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Creating account...</span>
                                </>
                            ) : (
                                <>
                                    <span>Create Account</span>
                                    <span className="action-icon">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;