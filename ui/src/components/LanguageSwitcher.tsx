"use client";

import { useLocale } from 'next-intl';
import { setClientLocale, getClientLocale, type Locale } from '@/lib/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { useState, useEffect } from 'react';

export function LanguageSwitcher() {
  const serverLocale = useLocale();
  const [currentLocale, setCurrentLocale] = useState<Locale>(serverLocale as Locale);

  useEffect(() => {
    // Settings
    const clientLocale = getClientLocale();
    if (clientLocale !== serverLocale) {
      setCurrentLocale(clientLocale);
    }
  }, [serverLocale]);

  const changeLocale = (nextLocale: Locale) => {
    // Setcookie
    setClientLocale(nextLocale);
    setCurrentLocale(nextLocale);

    // 
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Languages className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLocale('en')} disabled={currentLocale === 'en'}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLocale('zh')} disabled={currentLocale === 'zh'}>
           
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}