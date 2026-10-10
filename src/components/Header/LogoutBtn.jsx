import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/authSlice';
import authservice from '../../appwrite/auth'; 

const LogoutBtn = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const logoutHandler = async () => {
        try {
            setLoading(true);
            await authservice.logout();
            dispatch(logout());
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
            // Even if Appwrite session is expired, reset local state
            dispatch(logout());
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            onClick={logoutHandler}
            disabled={loading}
            className="neu-btn-logout disabled:opacity-50"
            title="Log out of your account"
        >
            {loading ? (
                <svg className="animate-spin h-4 w-4 text-rose-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                /* Distinct exit styling (Ref: vinodjangid07/thin-duck-22) */
                <span className="door-icon">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {/* Doorway frame */}
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    {/* Animated exit arrow moving out */}
                    <span className="door-arrow absolute -right-0.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100">
                    </span>
                </span>
            )}
            <span>Logout</span>
        </button>
    );
};

export default LogoutBtn;