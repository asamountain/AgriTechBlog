import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  // Safety check to prevent constructor errors
  if (!date) {
    return 'Invalid Date';
  }
  
  try {
    const d = new Date(date);
    // Check if the date is valid
    if (isNaN(d.getTime())) {
      return 'Invalid Date';
    }
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Invalid Date';
  }
}

export function generateSlug(title: string): string {
  if (!title || typeof title !== 'string') {
    return '';
  }
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncateText(text: string, length: number): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

// getReadingTime removed - unused function
