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
          className="rounded-full w-10 h-10 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 outline-none border-none"
        >
          {theme === 'dark' ? (
             <Moon className="h-6 w-6 text-gray-700 dark:text-gray-300" style={{ width: '24px', height: '24px' }} />
          ) : theme === 'light' ? (
             <Sun className="h-6 w-6 text-gray-700 dark:text-gray-300" style={{ width: '24px', height: '24px' }} />
          ) : (
             <Laptop className="h-6 w-6 text-gray-700 dark:text-gray-300" style={{ width: '24px', height: '24px' }} />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="center" 
        className="w-40 p-2 overflow-hidden
                   bg-white dark:bg-secondary 
                   border border-gray-100 dark:border-gray-800
                   shadow-xl rounded-xl outline-none ring-0 focus:ring-0"
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
