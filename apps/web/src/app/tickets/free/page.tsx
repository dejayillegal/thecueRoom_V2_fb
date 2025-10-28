
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Ticket } from 'lucide-react';

export default function FreeTicketPage() {
  const [formData, setFormData] = useState({
    eventSlug: '',
    holderName: '',
    holderEmail: '',
  });
  const [ticket, setTicket] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/tickets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setTicket(data);
    } catch (error) {
      console.error('Ticket generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Free Ticket Generator</h1>
          <p className="text-gray-400 text-sm">Create QR-based free tickets for your events</p>
        </div>

        <Card className="bg-[#111111] border-[#1a1a1a] p-6">
          {!ticket ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="eventSlug" className="text-white text-sm">Event ID</Label>
                <Input
                  id="eventSlug"
                  value={formData.eventSlug}
                  onChange={(e) => setFormData({ ...formData, eventSlug: e.target.value })}
                  placeholder="e.g., warehouse-techno-2024"
                  className="mt-1 bg-[#0a0a0a] border-[#1a1a1a] text-white"
                />
              </div>

              <div>
                <Label htmlFor="holderName" className="text-white text-sm">Your Name</Label>
                <Input
                  id="holderName"
                  value={formData.holderName}
                  onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                  className="mt-1 bg-[#0a0a0a] border-[#1a1a1a] text-white"
                />
              </div>

              <div>
                <Label htmlFor="holderEmail" className="text-white text-sm">Email</Label>
                <Input
                  id="holderEmail"
                  type="email"
                  value={formData.holderEmail}
                  onChange={(e) => setFormData({ ...formData, holderEmail: e.target.value })}
                  className="mt-1 bg-[#0a0a0a] border-[#1a1a1a] text-white"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !formData.eventSlug || !formData.holderEmail}
                className="w-full bg-[#D1FF3D] text-black hover:bg-[#e7ff6f] font-semibold"
              >
                <Ticket className="w-4 h-4 mr-2" />
                Generate Free Ticket
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-white">Ticket Generated!</h2>
              <div className="bg-[#0a0a0a] p-6 rounded-lg border border-[#1a1a1a]">
                <img src={ticket.qrUrl} alt="Ticket QR Code" className="w-64 h-64 mx-auto mb-4" />
                <p className="text-gray-400 text-sm mb-2">Ticket ID: {ticket.ticketId}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(ticket.downloadUrl, '_blank')}
                  className="flex-1 bg-[#D1FF3D] text-black hover:bg-[#e7ff6f]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => setTicket(null)}
                  variant="outline"
                  className="flex-1 border-[#333333] text-white hover:bg-[#1a1a1a]"
                >
                  Generate Another
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
