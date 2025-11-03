
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, Flag, Clock } from 'lucide-react';

interface Report {
  id: string;
  targetType: string;
  targetId: string;
  reporterId: string;
  reason: string;
  status: string;
  createdAt: string;
}

export function ModerationPanel() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/forum/report');
      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (reportId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/forum/moderation/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          action,
          notes: reviewNotes,
        }),
      });

      if (response.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        setSelectedReport(null);
        setReviewNotes('');
      }
    } catch (error) {
      console.error('Review error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-400">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Flag className="w-6 h-6 text-[#D7FF3C]" />
          Moderation Queue
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          {reports.length} pending reports
        </div>
      </div>

      {reports.length === 0 ? (
        <Card className="bg-[#111111] border-[#1a1a1a] p-12 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <p className="text-white text-lg mb-2">All clear!</p>
          <p className="text-gray-400 text-sm">No pending moderation reports</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="bg-[#111111] border-[#1a1a1a] p-4 hover:border-[#2a2a2a] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/30 rounded">
                      {report.targetType}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{report.reason}</p>
                  <p className="text-xs text-gray-500">
                    Target ID: {report.targetId}
                  </p>
                </div>
              </div>

              {selectedReport === report.id && (
                <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add review notes (optional)..."
                    className="bg-[#0a0a0a] border-[#1a1a1a] text-white mb-3"
                    rows={3}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 mt-3">
                <Button
                  onClick={() => handleReview(report.id, 'approve')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleReview(report.id, 'reject')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}
                  variant="outline"
                  className="bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#2a2a2a]"
                  size="sm"
                >
                  {selectedReport === report.id ? 'Cancel' : 'Add Notes'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
