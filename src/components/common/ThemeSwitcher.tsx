import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Laptop, Check } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ThemeSwitcher({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const themes = [
    { code: 'light', label: t('settings.theme_options.light'), icon: Sun },
    { code: 'dark', label: t('settings.theme_options.dark'), icon: Moon },
    { code: 'system', label: t('settings.theme_options.system'), icon: Laptop },
  ] as const;

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full w-10 h-10 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 outline-none border-none group"
        >
          <div className={`relative w-7 h-7 rounded-full shadow-md overflow-hidden group-hover:scale-110 transition-transform duration-300 flex items-center justify-center
            ${theme === 'light' ? 'bg-amber-100' : theme === 'dark' ? 'bg-indigo-950' : 'bg-slate-200 dark:bg-slate-800'}
          `}>
             {/* 아이콘 */}
             {theme === 'dark' ? (
                 <Moon className="h-4 w-4 text-indigo-200 z-10 relative" />
              ) : theme === 'light' ? (
                 <Sun className="h-4 w-4 text-amber-600 z-10 relative" />
              ) : (
                 <Laptop className="h-4 w-4 text-slate-600 dark:text-slate-300 z-10 relative" />
              )}
             
             {/* 배경 그라데이션 (Glossy Effect) */}
             <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/10 via-transparent to-white/40 pointer-events-none" />
             {/* 상단 하이라이트 */}
             <div className="absolute inset-0 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] pointer-events-none" />
          </div>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="center" 
          className="w-40 p-2 overflow-hidden
                     bg-white dark:bg-secondary 
                     border border-gray-100 dark:border-gray-700/70
                     shadow-xl rounded-xl outline-none ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none z-[200]"
        sideOffset={8}
        onInteractOutside={(e) => {
          // Allow closing when clicking outside
        }}
      >
        <div className="px-2 py-2 border-b border-gray-100 dark:border-gray-700 mb-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {t('settings.themeSelect')}
          </p>
        </div>
        
        <div className="flex flex-col gap-1">
          {themes.map((item) => {
            const isActive = theme === item.code;
            const Icon = item.icon;
            
            return (
              <DropdownMenuItem
                key={item.code}
                onClick={() => setTheme(item.code)}
                className={`
                  rounded-lg py-2.5 px-3 cursor-pointer transition-colors focus:ring-0 focus:outline-none
                  ${isActive 
                    ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary font-semibold focus:bg-primary/15 dark:focus:bg-primary/25' 
                    : 'hover:bg-primary/5 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus:bg-primary/5 dark:focus:bg-gray-800'
                  }
                `}
              >
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {isActive && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
