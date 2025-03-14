import { useState } from "react";

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DatePicker({ selectedDate, onDateChange }: DatePickerProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [isMonthSelectOpen, setIsMonthSelectOpen] = useState(false);
  const [isYearSelectOpen, setIsYearSelectOpen] = useState(false);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = Array.from(
    { length: 20 },
    (_, i) => new Date().getFullYear() - 10 + i,
  );

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isDateDisabled = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return date < tomorrow;
  };

  const handleDateClick = (day: number) => {
    const selectedYear = currentDate.getFullYear();
    const selectedMonth = currentDate.getMonth();

    if (isDateDisabled(selectedYear, selectedMonth, day)) {
      return;
    }

    const newDate = new Date(selectedYear, selectedMonth, day);
    onDateChange(newDate);
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1));
    setIsMonthSelectOpen(false);
  };

  const handleYearSelect = (year: number) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
    setIsYearSelectOpen(false);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(
      currentDate.getFullYear(),
      currentDate.getMonth(),
    );
    const firstDayOfMonth = getFirstDayOfMonth(
      currentDate.getFullYear(),
      currentDate.getMonth(),
    );
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected =
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentDate.getMonth() &&
        selectedDate.getFullYear() === currentDate.getFullYear();

      const isDisabled = isDateDisabled(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day,
      );

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={isDisabled}
          className={`h-10 w-10 flex items-center justify-center transition-colors
            ${isSelected ? "bg-primary text-white" : ""}
            ${
              isDisabled
                ? "text-gray-300 cursor-not-allowed"
                : "hover:bg-[#F5F1F9] text-primary"
            }`}
        >
          {day}
        </button>,
      );
    }

    return days;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4">
          <div className="relative">
            <button
              onClick={() => setIsMonthSelectOpen(!isMonthSelectOpen)}
              className="flex gap-2 leading-5 text-xl font-bold text-primary"
            >
              {months[currentDate.getMonth()]}
              {isMonthSelectOpen ? (
                <img src="/icons/chevron-up.svg" />
              ) : (
                <img src="/icons/chevron-down.svg" />
              )}
            </button>
            {isMonthSelectOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md py-1 z-10 max-h-48 overflow-y-auto">
                {months.map((month, index) => (
                  <button
                    key={month}
                    onClick={() => handleMonthSelect(index)}
                    className="block w-full px-4 py-2 text-left text-primary hover:bg-[#F5F1F9] transition-colors"
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setIsYearSelectOpen(!isYearSelectOpen)}
              className="flex gap-2 leading-5 text-xl font-bold text-primary"
            >
              {currentDate.getFullYear()}
              {isYearSelectOpen ? (
                <img src="/icons/chevron-up.svg" />
              ) : (
                <img src="/icons/chevron-down.svg" />
              )}
            </button>
            {isYearSelectOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md py-1 z-10 max-h-48 overflow-y-auto">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleYearSelect(year)}
                    className="block w-full px-4 py-2 text-left text-primary hover:bg-[#F5F1F9] transition-colors"
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-7 gap-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <div
              key={index}
              className="h-10 w-10 flex items-center justify-center text-sm font-medium text-secondary"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="h-[1px] bg-[#ECE3F4]" />
        <div className="grid grid-cols-7 gap-x-1 gap-y-1">
          {renderCalendar()}
        </div>
      </div>
    </div>
  );
}
