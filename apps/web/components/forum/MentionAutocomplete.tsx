
'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Shield } from 'lucide-react';

interface User {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  verified: boolean;
  isModerator: boolean;
}

interface MentionAutocompleteProps {
  query: string;
  onSelect: (user: User) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export function MentionAutocomplete({ query, onSelect, onClose, position }: MentionAutocompleteProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (query.length < 1) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/forum/mention/resolve?q=${encodeURIComponent(query)}&limit=10`);
        const data = await response.json();
        setUsers(data.users || []);
      } catch (error) {
        console.error('Mention fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % users.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + users.length) % users.length);
      } else if (e.key === 'Enter' && users[selectedIndex]) {
        e.preventDefault();
        onSelect(users[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [users, selectedIndex, onSelect, onClose]);

  if (users.length === 0 && !loading) {
    return null;
  }

  return (
    <div
      ref={ref}
      className="absolute z-50 w-64 bg-[#111111] border border-[#1a1a1a] rounded-lg shadow-xl overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {loading ? (
        <div className="p-3 text-sm text-gray-500 text-center">Loading...</div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          {users.map((user, index) => (
            <button
              key={user.userId}
              onClick={() => onSelect(user)}
              className={`
                w-full flex items-center gap-3 p-3 text-left transition-colors
                ${index === selectedIndex ? 'bg-[#1a1a1a]' : 'hover:bg-[#0a0a0a]'}
              `}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D7FF3C] to-[#9B5CFF] flex items-center justify-center text-black text-xs font-bold">
                {user.displayName[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-white truncate">
                    {user.displayName}
                  </span>
                  {user.verified && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  )}
                  {user.isModerator && (
                    <Shield className="w-3.5 h-3.5 text-[#9B5CFF] flex-shrink-0" />
                  )}
                </div>
                <span className="text-xs text-gray-500">@{user.username}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
