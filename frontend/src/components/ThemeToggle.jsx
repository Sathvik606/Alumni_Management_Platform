import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme.jsx';

export default function ThemeToggle({ size = 'icon-sm' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Button
      aria-label="Toggle theme"
      variant="ghost"
      size={size}
      onClick={toggleTheme}
      className="rounded-xl border border-transparent hover:border-border/60 hover:bg-accent/10"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span className="sr-only">Switch theme</span>
    </Button>
  );
}
