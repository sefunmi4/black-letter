import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('googleIdToken');
    const localUser = localStorage.getItem('username');
    if (token || localUser) {
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

  const handleSubmit = e => {
    e.preventDefault();
    if (username && password) {
      localStorage.setItem('username', username);
      navigate('/Dashboard');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
          <input
            className="border p-2 rounded"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <input
            type="password"
            className="border p-2 rounded"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">
            Sign In
          </button>
        </form>
        <div className="flex justify-center">
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <GoogleLogin onSuccess={handleSuccess} onError={() => console.error('Login Failed')} />
          </GoogleOAuthProvider>
        </div>
      </div>
    </div>
  );
}
