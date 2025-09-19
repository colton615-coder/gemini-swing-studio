import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, Download, HardDrive } from 'lucide-react';
import { OfflineService } from '@/services/offline';
import { toast } from 'sonner';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [storageUsage, setStorageUsage] = useState({ used: 0, quota: 0 });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are now offline. Data will be saved locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update storage usage
    const updateStorageUsage = () => {
      const usage = OfflineService.getStorageUsage();
      setStorageUsage(usage);
    };

    updateStorageUsage();
    const interval = setInterval(updateStorageUsage, 30000); // Update every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearOfflineData = () => {
    OfflineService.clearOfflineData();
    toast.success('Offline data cleared');
    setStorageUsage({ used: 0, quota: 0 });
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-orange-500" />
            )}
            <Badge variant={isOnline ? "default" : "secondary"}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {formatBytes(storageUsage.used)}
              {storageUsage.quota > 0 && ` / ${formatBytes(storageUsage.quota)}`}
            </span>
          </div>
        </div>
        
        {!isOnline && (
          <div className="text-sm text-muted-foreground mb-3">
            Your data is being saved locally and will sync when you're back online.
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Offline mode enabled
          </div>
          
          {storageUsage.used > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearOfflineData}
            >
              Clear Data
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};