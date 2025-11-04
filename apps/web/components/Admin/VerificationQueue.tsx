
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, Clock, Loader2, ExternalLink, Search, Filter } from 'lucide-react';
import { useToast } from '@/../../src/hooks/use-toast';

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
  const { toast } = useToast();
  const [tasks, setTasks] = useState<VerificationTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<VerificationTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, priorityFilter]);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/admin/verification', {
        headers: { 'x-admin': 'true' },
      });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch verification tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load verification queue',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = tasks;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.user?.email.toLowerCase().includes(lower) ||
          t.user?.username.toLowerCase().includes(lower) ||
          t.job?.profileUrl.toLowerCase().includes(lower)
      );
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((t) => t.task.priority === priorityFilter);
    }

    setFilteredTasks(filtered);
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
        setTasks(tasks.filter((t) => t.task.id !== taskId));
        setAdminNotes((prev) => {
          const { [taskId]: _, ...rest } = prev;
          return rest;
        });
        toast({
          title: 'Success',
          description: `Verification ${action === 'approve' ? 'approved' : 'denied'}`,
        });
      } else {
        throw new Error('Failed to process verification');
      }
    } catch (error) {
      console.error('Failed to process task:', error);
      toast({
        title: 'Error',
        description: 'Failed to process verification',
        variant: 'destructive',
      });
    } finally {
      setProcessingTaskId(null);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleBulkApprove = async () => {
    for (const taskId of selectedTasks) {
      await handleAction(taskId, 'approve');
    }
    setSelectedTasks(new Set());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#D7FF3C]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-[#0b0b0b]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#D7FF3C] mb-2">Verification Queue</h1>
        <p className="text-gray-400">
          {filteredTasks.length} pending verification{filteredTasks.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by email, username, or URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#111] border-[#222] text-white"
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px] bg-[#111] border-[#222] text-white">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#111] border-[#222]">
            <SelectItem value="all" className="text-white">All Priorities</SelectItem>
            <SelectItem value="high" className="text-white">High Priority</SelectItem>
            <SelectItem value="normal" className="text-white">Normal Priority</SelectItem>
            <SelectItem value="low" className="text-white">Low Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedTasks.size > 0 && (
        <div className="mb-4 p-4 bg-[#111] border border-[#222] rounded-lg flex items-center justify-between">
          <span className="text-white">{selectedTasks.size} task(s) selected</span>
          <Button onClick={handleBulkApprove} className="bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Approve Selected
          </Button>
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <Card className="bg-[#111] border-[#222] p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-[#D7FF3C] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">All Caught Up!</h2>
          <p className="text-gray-400">No pending verification tasks at the moment.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((item) => (
            <Card key={item.task.id} className="bg-[#111] border-[#222] p-6">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selectedTasks.has(item.task.id)}
                  onChange={() => toggleTaskSelection(item.task.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">
                      {item.user?.username || 'Unknown User'}
                    </h3>
                    <span className="text-sm text-gray-400">({item.user?.email || 'No email'})</span>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        item.task.priority === 'high'
                          ? 'bg-red-500/20 text-red-400'
                          : item.task.priority === 'low'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {item.task.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                    <Clock className="w-4 h-4" />
                    <span>Submitted {new Date(item.task.createdAt).toLocaleDateString()}</span>
                  </div>

                  {item.job && (
                    <div className="bg-[#0a0a0a] rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-400">AI Score</p>
                          <p className="text-lg font-semibold text-white">{item.job.score || 'N/A'} / 100</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Profile URL</p>
                          <a
                            href={item.job.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#D7FF3C] hover:text-[#D7FF3C]/80 flex items-center gap-1"
                          >
                            View Profile
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      {item.job.reviewNotes && (
                        <div className="border-t border-[#222] pt-3">
                          <p className="text-sm text-gray-400 mb-1">AI Analysis:</p>
                          <p className="text-sm text-gray-300">{item.job.reviewNotes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Admin Notes (optional)</label>
                      <Textarea
                        value={adminNotes[item.task.id] || ''}
                        onChange={(e) =>
                          setAdminNotes((prev) => ({
                            ...prev,
                            [item.task.id]: e.target.value,
                          }))
                        }
                        placeholder="Add any notes about your decision..."
                        className="bg-[#0a0a0a] border-[#222] text-white"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleAction(item.task.id, 'approve')}
                        disabled={processingTaskId === item.task.id}
                        className="bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90"
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
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
