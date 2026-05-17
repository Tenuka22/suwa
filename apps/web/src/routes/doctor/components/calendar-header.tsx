"use client";

import { Button } from "@zen-doc/ui/components/button";
import { addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarHeaderProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function CalendarHeader({
  currentMonth,
  onMonthChange,
}: CalendarHeaderProps) {
  const monthLabel = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(currentMonth);

  const handlePrevious = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  const handleNext = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Button onClick={handlePrevious} size="icon" variant="outline">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-36 text-center font-medium">{monthLabel}</div>
      <Button onClick={handleNext} size="icon" variant="outline">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
