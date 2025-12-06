import React, { useState } from 'react';
import { Home, Save, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface RoomBindingProps {
  userId: string;
  onBindSuccess: (roomId: string) => void;
}

export const RoomBinding: React.FC<RoomBindingProps> = ({ userId, onBindSuccess }) => {
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBind = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) return;
    
    setIsLoading(true);
    setError('');

    try {
      // Insert binding into Supabase
      const { error: dbError } = await supabase
        .from('user_bindings')
        .insert([
          { user_id: userId, room_id: roomId.toUpperCase() }
        ]);

      if (dbError) throw dbError;

      onBindSuccess(roomId.toUpperCase());
    } catch (err: any) {
      console.error(err);
      setError(err.message || '绑定失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-6 animate-fade-in z-50">
      <div className="w-full max-w-sm text-center">
        
        <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-indigo-400">
          <Home size={40} />
        </div>

        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">绑定宿舍</h2>
        <p className="text-gray-500 mb-8">请填写您的宿舍号（如 T50622）以同步数据</p>

        <form onSubmit={handleBind} className="space-y-4">
          <div className="relative">
            <input 
              type="text" 
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              placeholder="宿舍号 (例如 T8201)"
              className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 outline-none font-bold text-center text-xl uppercase placeholder:normal-case placeholder:font-medium transition-all"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-bold bg-red-50 dark:bg-red-900/20 py-2 rounded-xl">
              {error}
            </p>
          )}

          <button 
            type="submit" 
            disabled={isLoading || !roomId}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>确认绑定</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
