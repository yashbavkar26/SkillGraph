import React, { useState } from 'react';
import {
  loginUser,
  registerUser,
  type LoginResponse,
  type UserRole,
} from '../api/client';

type LoginProps = {
  onLoginSuccess: (result: LoginResponse) => void;
};

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('candidate');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result =
        mode === 'register'
          ? await registerUser({ name: name.trim(), email: normalizedEmail, role })
          : await loginUser({ email: normalizedEmail, role });
      onLoginSuccess(result);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="recruiter-shell" style={{ display: 'grid', placeItems: 'center', minHeight: '85vh' }}>
      <section className="search-form" style={{ width: 'min(520px, 100%)' }}>
        <div className="search-form__header">
          <div>
            <p className="eyebrow">SkillGraph Access</p>
            <h1>
              {role === 'candidate' ? 'Candidate' : 'Recruiter'}{' '}
              {mode === 'login' ? 'Login' : 'Register'}
            </h1>
          </div>
          <p className="search-form__lede">
            Choose role and action, then continue with email authentication.
          </p>
        </div>

        <form className="search-form__grid" onSubmit={handleSubmit}>
          <div className="field field--full">
            <span>Role</span>
            <div className="tag-row">
              <button
                type="button"
                className={`tag ${role === 'candidate' ? '' : 'tag--muted'}`}
                onClick={() => setRole('candidate')}
              >
                Candidate
              </button>
              <button
                type="button"
                className={`tag ${role === 'recruiter' ? '' : 'tag--muted'}`}
                onClick={() => setRole('recruiter')}
              >
                Recruiter
              </button>
            </div>
          </div>

          <div className="field field--full">
            <span>Action</span>
            <div className="tag-row">
              <button
                type="button"
                className={`tag ${mode === 'login' ? '' : 'tag--muted'}`}
                onClick={() => setMode('login')}
              >
                Login
              </button>
              <button
                type="button"
                className={`tag ${mode === 'register' ? '' : 'tag--muted'}`}
                onClick={() => setMode('register')}
              >
                Register
              </button>
            </div>
          </div>

          {mode === 'register' ? (
            <label className="field field--full">
              <span>Full Name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your full name"
                required
              />
            </label>
          ) : null}

          <label className="field field--full">
            <span>Email Address</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          {error ? (
            <p className="inline-message inline-message--error field--full" role="alert">
              {error}
            </p>
          ) : null}

          <div className="search-form__actions field--full">
            <button type="submit" className="button button--primary" disabled={loading}>
              {loading
                ? 'Please wait...'
                : role === 'candidate' && mode === 'register'
                ? 'Register Candidate'
                : role === 'candidate' && mode === 'login'
                ? 'Login Candidate'
                : role === 'recruiter' && mode === 'register'
                ? 'Register Recruiter'
                : 'Login Recruiter'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default Login;
