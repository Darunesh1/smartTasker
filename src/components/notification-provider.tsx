"use client";

import { useBrowserNotifications } from "@/hooks/use-browser-notifications";
import { type ReactNode } from "react";

export default function NotificationProvider({ children }: { children: ReactNode }) {
    // This hook initializes the notification system and schedules reminders.
    useBrowserNotifications();
    return <>{children}</>;
}
