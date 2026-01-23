export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();

  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
    };
    const formattedTime = date.toLocaleTimeString(undefined, timeOptions);
    return `Today, ${formattedTime}`;
  } else {
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString(undefined, dateOptions);
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  return date.toLocaleDateString("en-GB", dateOptions);
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  };
  return date.toLocaleString("en-GB", dateOptions);
}

export function calculateDateDifference(timestamp: number): string | null {
  const inputDate = new Date(timestamp * 1000);
  const now = new Date();

  const timeDiff = inputDate.getTime() - now.getTime();
  const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  if (dayDiff < 1) {
    return null;
  } else if (dayDiff < 2) {
    return `${dayDiff} day`;
  } else {
    return `${dayDiff} days`;
  }
}
