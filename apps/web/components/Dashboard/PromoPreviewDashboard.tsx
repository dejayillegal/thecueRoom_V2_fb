
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Trash2, Sparkles } from 'lucide-react';
import { SocialPromoModal } from '../AI/SocialPromoModal';

interface Promo {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  tags: string[];
  createdAt: string;
}

export function PromoPreviewDashboard() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPromos();
  }, []);

  const loadPromos = async () => {
    try {
      const response = await fetch('/api/ai/social-promo/list');
      if (response.ok) {
        const data = await response.json();
        setPromos(data.promos || []);
      }
    } catch (error) {
      console.error('Failed to load promos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (imageUrl: string, id: string) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `promo-${id}.png`;
    a.click();
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/ai/social-promo/${id}`, { method: 'DELETE' });
      setPromos(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete promo:', error);
    }
  };

  return (
    <>
      <Card className="bg-[#0f0f0f] border-[#1a1a1a] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">My Promos</h2>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-[#D1FF3D] text-black hover:bg-[#e7ff6f]"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Create Promo
          </Button>
        </div>

        {loading ? (
          <p className="text-gray-400 text-center py-8">Loading...</p>
        ) : promos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No promos yet</p>
            <Button
              onClick={() => setShowModal(true)}
              variant="outline"
              className="border-lime-400/50 text-lime-400"
            >
              Create your first promo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promos.map(promo => (
              <div key={promo.id} className="bg-[#1a1a1a] rounded-lg overflow-hidden">
                <img
                  src={promo.imageUrl}
                  alt={promo.title}
                  className="w-full aspect-square object-cover"
                />
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-2">{promo.title}</h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{promo.caption}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleDownload(promo.imageUrl, promo.id)}
                      className="flex-1 bg-lime-400 text-black hover:bg-lime-500"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-700"
                    >
                      <Share2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(promo.id)}
                      className="border-gray-700 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <SocialPromoModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}
