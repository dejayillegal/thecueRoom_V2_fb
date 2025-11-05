
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PlaylistSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: string) => void;
  loading?: boolean;
}

export function PlaylistScheduler({ isOpen, onClose, onSchedule, loading = false }: PlaylistSchedulerProps) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const handleSubmit = () => {
    if (!scheduledDate || !scheduledTime) return;
    
    const dateTime = `${scheduledDate}T${scheduledTime}:00.000Z`;
    onSchedule(dateTime);
    setScheduledDate('');
    setScheduledTime('');
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
        <DialogHeader>
          <DialogTitle>Schedule Playlist Publish</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="schedule-date">Publish Date</Label>
            <Input
              id="schedule-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={minDate}
              className="bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="schedule-time">Publish Time (UTC)</Label>
            <Input
              id="schedule-time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1 border-neutral-700"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-lime-500 hover:bg-lime-600 text-black"
              onClick={handleSubmit}
              disabled={!scheduledDate || !scheduledTime || loading}
            >
              {loading ? 'Scheduling...' : 'Schedule'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
