
import { CoverArtStudio } from '@/components/AI/CoverArtStudio';

export const metadata = {
  title: 'AI Cover Art Studio | thecueRoom',
  description: 'Generate unique cover art with AI',
};

export default function CoverArtPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">AI Cover Art Studio</h1>
        <p className="text-gray-400 text-sm">Generate unique, on-brand cover art from a simple text prompt</p>
      </div>
      <CoverArtStudio />
    </div>
  );
}
