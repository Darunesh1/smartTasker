"use client";

import { useFcm } from "@/hooks/use-fcm";
import { type ReactNode } from "react";

export default function NotificationProvider({ children }: { children: ReactNode }) {
    useFcm();
    return <>{children}</>;
}
