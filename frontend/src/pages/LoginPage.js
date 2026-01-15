import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password
      });

      if (response.data.success) {
        login(response.data.user);
        navigate('/');
      } else {
        setError(response.data.message || 'فشل تسجيل الدخول');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'var(--gradient)',
      padding: '1rem'
    }}>
      <div className="w-full max-w-md">
        {/* Logo Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}>
            <span className="text-5xl text-white font-bold">غ</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">الغدير نقل و تخليص</h1>
          <p className="text-white opacity-90">نظام إدارة العملاء والفواتير</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-center mb-6" style={{ color: 'var(--color-text)' }}>
            تسجيل الدخول
          </h2>

          {error && (
            <div className="mb-4 p-4 rounded-lg" style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                اسم المستخدم
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border-2 transition-all"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)'
                }}
                placeholder="أدخل اسم المستخدم"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border-2 transition-all"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)'
                }}
                placeholder="أدخل كلمة المرور"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--gradient)',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
            >
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-lg" style={{
            backgroundColor: 'var(--color-background)',
            border: '1px solid var(--color-border)'
          }}>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <strong>حسابات تجريبية:</strong><br/>
              مدير: star / star1996@<br/>
              موظف: muhanad / muhanad1996
            </p>
          </div>
        </div>

        <p className="text-center text-white mt-6 opacity-75 text-sm">
          © 2026 الغدير نقل و تخليص. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
