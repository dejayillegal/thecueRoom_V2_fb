import { EPKStudioClient } from '@/components/EPK/EPKStudioClient';

export const metadata = {
  title: 'AI EPK Generator | thecueRoom',
  description: 'Build a professional Electronic Press Kit with AI assistance and advanced template selection',
};

export default function EPKGeneratorPage() {
  return (
    <div className="min-h-screen bg-black">
      <EPKStudioClient />
    </div>
  );
}
