import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const Protected = ({ children, authentication = true }) => {
  const navigate = useNavigate();
  const authStatus = useSelector((state) => state.auth.status);

  useEffect(() => {
    if (authentication && authStatus !== authentication) {
      navigate('/login');
    } else if (!authentication && authStatus !== authentication) {
      navigate('/');
    }
  }, [authStatus, navigate, authentication]);

  const isUnauthorized = (authentication && authStatus !== authentication) || (!authentication && authStatus !== authentication);

  if (isUnauthorized) {
    return null;
  }

  return <>{children}</>;
};

export default Protected;


