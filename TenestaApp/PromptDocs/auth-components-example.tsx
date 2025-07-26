import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Phone, Building, Home, AlertCircle, CheckCircle } from 'lucide-react';

// Mock Supabase client
const supabase = {
  functions: {
    invoke: async (functionName, { body }) => {
      console.log(`Calling ${functionName} with:`, body);
      
      // Simulate API responses
      if (functionName === 'auth-signup') {
        if (body.email === 'existing@example.com') {
          throw new Error('An account with this email already exists');
        }
        return { data: { message: 'Registration successful!' } };
      }
      
      if (functionName === 'auth-login') {
        if (body.password !== 'Test123!') {
          throw new Error('Invalid email or password');
        }
        return { data: { user: { email: body.email }, session: { access_token: 'mock-token' } } };
      }
      
      return { data: { message: 'Success!' } };
    }
  }
};

function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('tenant');
  const [showPassword, setShowPassword] = useState(false);
  
  // Password strength
  const checkPasswordStrength = (pass) => {
    const checks = {
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pass)
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    const strength = score <= 2 ? 'weak' : score === 3 ? 'fair' : score === 4 ? 'good' : 'strong';
    
    return { checks, score, strength };
  };
  
  const passwordStrength = checkPasswordStrength(password);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      if (mode === 'login') {
        const { data } = await supabase.functions.invoke('auth-login', {
          body: { email, password }
        });
        setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
      } else if (mode === 'signup') {
        const { data } = await supabase.functions.invoke('auth-signup', {
          body: {
            email,
            password,
            full_name: fullName,
            phone,
            role
          }
        });
        setMessage({ type: 'success', text: 'Registration successful! Please check your email.' });
      } else if (mode === 'reset') {
        await supabase.functions.invoke('auth-password-reset', {
          body: { email }
        });
        setMessage({ type: 'success', text: 'Password reset link sent to your email!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tenesta</h1>
          <p className="text-gray-600">
            {mode === 'login' && 'Welcome back! Sign in to your account.'}
            {mode === 'signup' && 'Create your account to get started.'}
            {mode === 'reset' && 'Reset your password.'}
          </p>
        </div>
        
        {/* Auth Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Message Alert */}
          {message.text && (
            <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span>{message.text}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            
            {/* Password Field (Login & Signup) */}
            {(mode === 'login' || mode === 'signup') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                
                {/* Password Strength Indicator (Signup) */}
                {mode === 'signup' && password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded ${
                            i <= passwordStrength.score
                              ? passwordStrength.strength === 'weak' ? 'bg-red-500'
                              : passwordStrength.strength === 'fair' ? 'bg-yellow-500'
                              : passwordStrength.strength === 'good' ? 'bg-blue-500'
                              : 'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs ${
                      passwordStrength.strength === 'weak' ? 'text-red-600'
                      : passwordStrength.strength === 'fair' ? 'text-yellow-600'
                      : passwordStrength.strength === 'good' ? 'text-blue-600'
                      : 'text-green-600'
                    }`}>
                      Password strength: {passwordStrength.strength}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Signup Fields */}
            {mode === 'signup' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
                
                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    I am a...
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('tenant')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        role === 'tenant'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Home className="mx-auto mb-2 text-indigo-600" size={24} />
                      <p className="font-medium">Tenant</p>
                      <p className="text-xs text-gray-600 mt-1">Looking for a place</p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setRole('landlord')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        role === 'landlord'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Building className="mx-auto mb-2 text-indigo-600" size={24} />
                      <p className="font-medium">Landlord</p>
                      <p className="text-xs text-gray-600 mt-1">Managing properties</p>
                    </button>
                  </div>
                </div>
              </>
            )}
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (mode === 'signup' && passwordStrength.score < 4)}
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 
                mode === 'login' ? 'Sign In' :
                mode === 'signup' ? 'Create Account' :
                'Send Reset Link'
              }
            </button>
          </form>
          
          {/* Mode Switcher */}
          <div className="mt-6 text-center space-y-2">
            {mode === 'login' && (
              <>
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('signup');
                      setMessage({ type: '', text: '' });
                    }}
                    className="text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    Sign up
                  </button>
                </p>
                <p className="text-sm text-gray-600">
                  <button
                    onClick={() => {
                      setMode('reset');
                      setMessage({ type: '', text: '' });
                    }}
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot your password?
                  </button>
                </p>
              </>
            )}
            
            {mode === 'signup' && (
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('login');
                    setMessage({ type: '', text: '' });
                  }}
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
            
            {mode === 'reset' && (
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <button
                  onClick={() => {
                    setMode('login');
                    setMessage({ type: '', text: '' });
                  }}
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
          
          {/* OAuth Buttons */}
          {(mode === 'login' || mode === 'signup') && (
            <>
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="ml-2">Google</span>
                  </button>
                  
                  <button
                    type="button"
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    <span className="ml-2">Apple</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Demo Instructions */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Demo Mode:</strong> Try logging in with any email and password "Test123!"
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;