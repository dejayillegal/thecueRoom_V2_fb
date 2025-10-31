'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, Clock, Loader2, ExternalLink } from 'lucide-react';

interface VerificationTask {
  task: {
    id: string;
    userId: string;
    jobId: string | null;
    status: string;
    priority: string;
    notes: string | null;
    createdAt: string;
  };
  job: {
    id: string;
    profileUrl: string;
    status: string;
    score: number | null;
    evidence: any;
    reviewNotes: string | null;
  } | null;
  user: {
    id: string;
    email: string;
    username: string;
  } | null;
}

export function VerificationQueue() {
  const [tasks, setTasks] = useState<VerificationTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/admin/verification', {
        headers: { 'x-admin': 'true' },
      });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch verification tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (taskId: string, action: 'approve' | 'deny') => {
    setProcessingTaskId(taskId);
    
    try {
      const res = await fetch('/api/admin/verification', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin': 'true',
        },
        body: JSON.stringify({
          taskId,
          action,
          notes: adminNotes[taskId] || '',
        }),
      });

      if (res.ok) {
        // Remove the task from the list
        setTasks(tasks.filter(t => t.task.id !== taskId));
        setAdminNotes(prev => {
          const { [taskId]: _, ...rest } = prev;
          return rest;
        });
      } else {
        alert('Failed to process verification task');
      }
    } catch (error) {
      console.error('Failed to process task:', error);
      alert('An error occurred');
    } finally {
      setProcessingTaskId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-lime-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-lime-400 mb-2">Verification Queue</h1>
        <p className="text-gray-400">
          {tasks.length} pending verification{tasks.length !== 1 ? 's' : ''}
        </p>
      </div>

      {tasks.length === 0 ? (
        <Card className="bg-black border-lime-400/20 p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-lime-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">All Caught Up!</h2>
          <p className="text-gray-400">No pending verification tasks at the moment.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((item) => (
            <Card key={item.task.id} className="bg-black border-lime-400/20 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">
                      {item.user?.username || 'Unknown User'}
                    </h3>
                    <span className="text-sm text-gray-400">
                      ({item.user?.email || 'No email'})
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                    <Clock className="w-4 h-4" />
                    <span>
                      Submitted {new Date(item.task.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {item.job && (
                    <div className="bg-gray-900 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-400">AI Score</p>
                          <p className="text-lg font-semibold text-white">
                            {item.job.score || 'N/A'} / 100
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Profile URL</p>
                          <a
                            href={item.job.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-lime-400 hover:text-lime-500 flex items-center gap-1"
                          >
                            View Profile
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      {item.job.reviewNotes && (
                        <div className="border-t border-gray-800 pt-3">
                          <p className="text-sm text-gray-400 mb-1">AI Analysis:</p>
                          <p className="text-sm text-gray-300">{item.job.reviewNotes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {item.task.notes && (
                    <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-3 mb-4">
                      <p className="text-sm text-yellow-300">{item.task.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Admin Notes (optional)
                  </label>
                  <Textarea
                    value={adminNotes[item.task.id] || ''}
                    onChange={(e) =>
                      setAdminNotes(prev => ({
                        ...prev,
                        [item.task.id]: e.target.value,
                      }))
                    }
                    placeholder="Add any notes about your decision..."
                    className="bg-gray-900 border-gray-700 text-white"
                    rows={2}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleAction(item.task.id, 'approve')}
                    disabled={processingTaskId === item.task.id}
                    className="bg-lime-400 text-black hover:bg-lime-500"
                  >
                    {processingTaskId === item.task.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Approve & Verify
                  </Button>
                  
                  <Button
                    onClick={() => handleAction(item.task.id, 'deny')}
                    disabled={processingTaskId === item.task.id}
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    {processingTaskId === item.task.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Deny
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
