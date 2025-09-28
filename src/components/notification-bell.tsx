'use client';

import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { useBrowserNotifications } from "@/hooks/use-browser-notifications";

export default function NotificationBell() {
  const { 
    permission, 
    isSubscribed, 
    isLoading,
    requestPermission, 
    toggleSubscription,
  } = useBrowserNotifications();
  const { toast } = useToast();

  const handleTestNotification = () => {
    if (isSubscribed) {
      new Notification("Test Notification", {
        body: "This is a test notification from SmartTasker!",
        icon: '/logo.png' 
      });
      toast({
        title: "Test Notification Sent",
        description: "You should see a test notification from your browser.",
      });
    } else {
       toast({
        variant: "destructive",
        title: "Notifications Not Enabled",
        description: "Please enable notifications to send a test.",
      });
    }
  };

  const handleToggle = async (checked: boolean) => {
    await toggleSubscription(checked);
  };
  
  const getIcon = () => {
    if (isLoading) {
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
    if (isLoading) {
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
                <div className="text-sm text-muted-foreground">
                    <strong>Instructions:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Go to your browser's site settings for this page.</li>
                        <li>Find the "Notifications" permission.</li>
                        <li>Change the setting from "Block" to "Allow".</li>
                        <li>You may need to refresh the page after changing the setting.</li>
                    </ol>
                </div>
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
                    <Button onClick={requestPermission} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                        Receive browser notifications for your upcoming task deadlines.
                    </p>
                </div>
                 <Switch 
                    id="notification-toggle" 
                    checked={isSubscribed}
                    onCheckedChange={handleToggle}
                    disabled={isLoading}
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
                    <Button onClick={handleTestNotification} disabled={!isSubscribed}>
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
            Manage your preferences for browser-based task reminders.
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
