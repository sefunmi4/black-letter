import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

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
          <button type="submit" className="bg-green-500 text-white p-2 rounded">
            Sign Up
          </button>
          <button
            type="button"
            className="bg-blue-500 text-white p-2 rounded"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}
