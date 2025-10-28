
import { EPKEditor } from '@/components/AI/EPKEditor';

export const metadata = {
  title: 'AI EPK Generator | thecueRoom',
  description: 'Build a professional Electronic Press Kit',
};

export default function EPKGeneratorPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-[1400px] mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">AI EPK Generator</h1>
          <p className="text-gray-400 text-sm">Build a professional Electronic Press Kit ready to send to promoters</p>
        </div>
        <EPKEditor />
      </div>
    </div>
  );
}
