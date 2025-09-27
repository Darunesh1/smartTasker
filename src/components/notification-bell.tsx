'use client';

import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { useFcm } from "@/hooks/use-fcm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "./auth/auth-provider";
import { sendTestNotification } from "@/ai/flows/send-test-notification";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";

export default function NotificationBell() {
  const { user } = useAuth();
  const { 
    permission, 
    isTokenLoading, 
    isSubscribed, 
    requestPermissionAndSubscribe, 
    unsubscribe,
  } = useFcm();
  const { toast } = useToast();
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleTestNotification = async () => {
    if (!user) return;
    setIsSendingTest(true);
    try {
      await sendTestNotification({ userId: user.uid });
      toast({
        title: "Test Notification Sent",
        description: "You should receive a test notification shortly.",
      });
    } catch (error: any) {
      console.error("Error sending test notification:", error);
      toast({
        variant: "destructive",
        title: "Could not send test",
        description: error.message || "An unknown error occurred.",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await requestPermissionAndSubscribe();
    } else {
      await unsubscribe();
    }
  };
  
  const getIcon = () => {
    if (isTokenLoading) {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }
    if (isSubscribed) {
      return <BellRing className="h-5 w-5 text-green-500" />;
    }
    if (permission === 'denied') {
      return <BellOff className="h-5 w-5 text-destructive" />;
    }
    return <Bell className="h-5 w-5" />;
  };

  const getTooltipText = () => {
    if (isTokenLoading) {
        return "Loading notification status...";
    }
    if (isSubscribed) {
      return "Notifications are enabled";
    }
    if (permission === 'denied') {
      return "Notification permissions denied";
    }
    return "Manage notification settings";
  };
  
  const renderContent = () => {
    if (permission === 'denied') {
      return (
         <Card className="border-destructive">
            <CardHeader>
              <CardTitle>Notifications Blocked</CardTitle>
              <CardDescription>
                You have blocked notifications for this site. To receive task reminders, you'll need to manually enable them in your browser's settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    <strong>Instructions:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Go to your browser's site settings for this page.</li>
                        <li>Find the "Notifications" permission.</li>
                        <li>Change the setting from "Block" to "Allow".</li>
                        <li>You may need to refresh the page after changing the setting.</li>
                    </ol>
                </p>
            </CardContent>
          </Card>
      );
    }

    if (permission === 'default') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Enable Task Reminders</CardTitle>
                    <CardDescription>
                        Stay on top of your deadlines by enabling browser notifications.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={requestPermissionAndSubscribe} disabled={isTokenLoading}>
                        {isTokenLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enable Notifications
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    // Permission is 'granted'
    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4 rounded-md border p-4">
                <div className="flex-1 space-y-1">
                    <Label htmlFor="notification-toggle" className="text-base font-medium">
                        Task Reminders
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        Receive push notifications for your upcoming task deadlines.
                    </p>
                </div>
                 <Switch 
                    id="notification-toggle" 
                    checked={isSubscribed}
                    onCheckedChange={handleToggle}
                    disabled={isTokenLoading}
                />
            </div>

            {isSubscribed && (
                 <Card>
                    <CardHeader>
                    <CardTitle>Test Your Notifications</CardTitle>
                    <CardDescription>
                        Send a test notification to ensure everything is working correctly.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Button onClick={handleTestNotification} disabled={isSendingTest}>
                        {isSendingTest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Test Notification
                    </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title={getTooltipText()}>
          {getIcon()}
          <span className="sr-only">Notifications</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notification Settings</DialogTitle>
          <DialogDescription>
            Manage your preferences for task reminders.
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
