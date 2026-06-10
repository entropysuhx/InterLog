import { clsx, type ClassValue } from "clsx";
import { differenceInSeconds, format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function calculateDuration(startTime: string | Date, endTime: string | Date): number {
  return Math.max(0, differenceInSeconds(new Date(endTime), new Date(startTime)));
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "In progress";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function formatTimerDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return [hours, minutes, remainingSeconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

export function formatTimeRange(startTime: string, endTime: string | null): string {
  const start = format(new Date(startTime), "h:mm a");
  return endTime ? `${start} - ${format(new Date(endTime), "h:mm a")}` : `${start} - now`;
}

export function createLocalId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
