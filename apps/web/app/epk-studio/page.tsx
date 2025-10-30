import { EPKStudioClient } from '@/components/EPK/EPKStudioClient';

export const metadata = {
  title: 'EPK Studio | thecueRoom',
  description: 'Create professional Electronic Press Kits with advanced templates and drag-and-drop editing',
};

export default function EPKStudioPage() {
  return (
    <div className="min-h-screen bg-black">
      <EPKStudioClient />
    </div>
  );
}
