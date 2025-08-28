import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('googleIdToken');
    if (token) {
      navigate('/Dashboard');
    }
  }, [navigate]);

  const handleSuccess = credentialResponse => {
    const token = credentialResponse.credential;
    if (token) {
      localStorage.setItem('googleIdToken', token);
      navigate('/Dashboard');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <GoogleLogin onSuccess={handleSuccess} onError={() => console.error('Login Failed')} />
      </GoogleOAuthProvider>
    </div>
  );
}
