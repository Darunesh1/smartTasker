'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { FcmPermission } from '@/hooks/use-fcm';

interface NotificationPermissionDialogProps {
  permission: FcmPermission;
  isTokenLoading: boolean;
  isSendingTest: boolean;
  requestPermission: () => Promise<void>;
  onTestNotification: () => void;
}

export default function NotificationPermissionDialog({
  permission,
  isTokenLoading,
  isSendingTest,
  requestPermission,
  onTestNotification,
}: NotificationPermissionDialogProps) {
  
  const renderContent = () => {
    switch (permission) {
      case 'granted':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notifications Enabled</CardTitle>
              <CardDescription>
                You're all set to receive task reminders. You can send a test notification to make sure everything is working.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={onTestNotification} disabled={isSendingTest}>
                {isSendingTest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Test Notification
              </Button>
            </CardContent>
          </Card>
        );
      case 'denied':
        return (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle>Notifications Blocked</CardTitle>
              <CardDescription>
                You have blocked notifications. To receive task reminders, you'll need to manually enable them in your browser settings.
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
      default: // 'default'
        return (
          <Card>
            <CardHeader>
              <CardTitle>Enable Task Reminders</CardTitle>
              <CardDescription>
                Stay on top of your tasks by enabling notifications. We'll send you reminders before your deadlines.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={requestPermission} disabled={isTokenLoading}>
                {isTokenLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enable Notifications
              </Button>
            </CardContent>
          </Card>
        );
    }
  };

  return <div className="space-y-4">{renderContent()}</div>;
}
