import { useState } from 'react';
import { Eye, EyeOff, Key } from 'lucide-react';
import { Input } from '../ui/Input';

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ApiKeyInput({ value, onChange, disabled }: ApiKeyInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        label="Gemini API Key"
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="AIza..."
        disabled={disabled}
        hint={
          value.length > 4
            ? `Key ending in ...${value.slice(-4)}`
            : 'Your Gemini API key (stored in memory only)'
        }
      />
      <div className="absolute right-0 top-0 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
        <Key className="h-4 w-4 text-gray-300" />
      </div>
    </div>
  );
}
