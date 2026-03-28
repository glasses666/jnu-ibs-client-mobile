import { Home } from 'lucide-react';

type AuthLoadingScreenProps = {
  userName: string;
};

export const AuthLoadingScreen = ({ userName }: AuthLoadingScreenProps) => (
  <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col items-center justify-center z-[60] animate-fade-in">
    <div className="text-center">
      <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-indigo-400 animate-pulse">
        <Home size={40} />
      </div>
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">欢迎回家</h2>
      <p className="text-gray-500 font-medium">{userName || 'User'}</p>
      <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400">
        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
      </div>
    </div>
  </div>
);
