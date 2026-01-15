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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
      background: 'var(--gradient)',
      padding: '1rem'
    }}>
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Card */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl mb-6 transform hover:scale-110 transition-transform duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(20px)',
              border: '3px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}>
            <span className="text-6xl text-white font-bold drop-shadow-lg">غ</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">الغدير نقليات و تخليص كمركي</h1>
          <p className="text-white text-lg opacity-90 drop-shadow">نظام إدارة العملاء والفواتير الاحترافي</p>
        </div>

        {/* Login Card */}
        <div className="backdrop-blur-xl rounded-3xl shadow-2xl p-8 animate-slideUp"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4)'
          }}>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ 
              background: 'var(--gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              مرحباً بك
            </h2>
            <p className="text-gray-600">سجل دخولك للمتابعة</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl animate-shake" style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: '2px solid #fecaca'
            }}>
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                اسم المستخدم
              </label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                  👤
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pr-12 pl-4 py-4 rounded-xl border-2 transition-all text-lg"
                  style={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)'
                  }}
                  placeholder="أدخل اسم المستخدم"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                  🔒
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pr-12 pl-4 py-4 rounded-xl border-2 transition-all text-lg"
                  style={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)'
                  }}
                  placeholder="أدخل كلمة المرور"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: 'var(--gradient)',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  جاري تسجيل الدخول...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>🚀</span>
                  تسجيل الدخول
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 p-5 rounded-xl" style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            border: '2px solid rgba(102, 126, 234, 0.2)'
          }}>
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>ℹ️</span>
              حسابات تجريبية:
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-mono bg-white px-2 py-1 rounded">مدير:</span>
                <span>star / star1996@</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-white px-2 py-1 rounded">موظف:</span>
                <span>muhanad / muhanad1996</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-white mt-8 opacity-90 text-sm drop-shadow">
          © 2026 الغدير نقليات و تخليص كمركي. جميع الحقوق محفوظة.
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.6s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-out;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default LoginPage;
