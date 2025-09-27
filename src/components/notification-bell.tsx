'use client';

import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { useFcm } from "@/hooks/use-fcm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "./auth/auth-provider";
import { sendTestNotification } from "@/ai/flows/send-test-notification";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import NotificationPermissionDialog from "./notification-permission-dialog";

export default function NotificationBell() {
  const { user } = useAuth();
  const { permission, requestPermission, isTokenLoading } = useFcm();
  const { toast } = useToast();
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleTestNotification = async () => {
    if (!user) return;
    setIsSendingTest(true);
    try {
      await sendTestNotification({ userId: user.uid });
      toast({
        title: "Test Notification Sent",
        description: "You should receive a test notification shortly.",
      });
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not send test notification.",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const getIcon = () => {
    if (isTokenLoading) {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }
    switch (permission) {
      case "granted":
        return <BellRing className="h-5 w-5 text-green-500" />;
      case "denied":
        return <BellOff className="h-5 w-5 text-destructive" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getTooltipText = () => {
    switch (permission) {
      case "granted":
        return "Notification permissions granted";
      case "denied":
        return "Notification permissions denied";
      default:
        return "Manage notification permissions";
    }
  };
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title={getTooltipText()}>
          {getIcon()}
          <span className="sr-only">Notifications</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notification Settings</DialogTitle>
        </DialogHeader>
        <NotificationPermissionDialog
          permission={permission}
          requestPermission={requestPermission}
          onTestNotification={handleTestNotification}
          isSendingTest={isSendingTest}
          isTokenLoading={isTokenLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
