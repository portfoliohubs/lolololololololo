import { useEffect } from 'react';

export function useContentProtection(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    // Prevent context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Prevent inspection and copy keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Ctrl or Meta combinations
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        // c = copy, u = view source, s = save, p = print, a = select all
        if (['c', 'u', 's', 'p', 'a'].includes(key)) {
          e.preventDefault();
          return false;
        }

        // Ctrl + Shift + I/J/C (DevTools)
        if (e.shiftKey && ['i', 'j', 'c'].includes(key)) {
          e.preventDefault();
          return false;
        }
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);
}
