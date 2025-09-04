'use client';

import * as React from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DateRangePickerProps {
  className?: string;
}

export function DatePickerWithRange({ className }: DateRangePickerProps) {
  return (
    <Button variant="outline" className={className}>
      <Calendar className="mr-2 h-4 w-4" />
      日付範囲を選択
    </Button>
  );
}