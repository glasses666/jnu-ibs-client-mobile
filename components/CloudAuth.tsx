import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Github, 
  MessageCircle, 
  ShieldCheck,
  User,
  Chrome,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface CloudAuthProps {
  onLoginSuccess: (user: any) => void;
  onAdminLogin: () => void;
}

export const CloudAuth: React.FC<CloudAuthProps> = ({ onLoginSuccess, onAdminLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        if (data.user) {
            onLoginSuccess(data.user);
        } else {
            setError("登录成功但未获取到用户信息。");
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (data.user) {
            onLoginSuccess(data.user); 
        } else {
            setError("注册成功，请查收验证邮件（如果已开启验证）。");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || '发生未知错误，请重试。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-6 animate-fade-in z-50 overflow-y-auto">
      <div className="w-full max-w-sm my-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-6">
            <User size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
            {isLogin ? '欢迎回来' : '创建账号'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
            {isLogin ? '登录以同步您的宿舍数据' : '注册一个账号绑定宿舍'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                <Mail size={20} />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="邮箱地址 / 学号"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all font-bold text-gray-900 dark:text-white placeholder:font-medium"
                required
              />
            </div>
            
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                <Lock size={20} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="密码"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all font-bold text-gray-900 dark:text-white placeholder:font-medium"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl flex items-center gap-2 animate-fade-in-up">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button type="button" className="text-xs font-bold text-indigo-500 hover:text-indigo-600">
              忘记密码?
            </button>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gray-900 dark:bg-white text-white dark:text-black font-bold py-4 rounded-2xl shadow-xl shadow-gray-200 dark:shadow-none hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isLogin ? '登录' : '注册'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-gray-900 px-2 text-gray-400 font-bold tracking-wider">或者</span>
          </div>
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold text-sm text-gray-600 dark:text-gray-300">
            <MessageCircle size={20} className="text-green-500" />
            <span>微信</span>
          </button>
          <button className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold text-sm text-gray-600 dark:text-gray-300">
            <Chrome size={20} className="text-blue-500" />
            <span>Google</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-sm font-medium text-gray-400">
            {isLogin ? "还没有账号? " : "已有账号? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-500 font-bold hover:underline"
            >
              {isLogin ? '立即注册' : '直接登录'}
            </button>
          </p>
          
          <button 
            onClick={onAdminLogin}
            className="mt-8 text-[10px] font-bold text-gray-300 hover:text-gray-500 flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <ShieldCheck size={12} />
            管理员通道
          </button>
        </div>

      </div>
    </div>
  );
};
