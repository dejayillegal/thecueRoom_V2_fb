import { MemeStudio } from "@/components/AI/MemeStudio";

export const metadata = {
  title: "AI Meme Studio | thecueRoom",
  description: "Create viral-worthy memes in seconds",
};

export default function MemeStudioPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-[1400px] mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">AI Meme Studio</h1>
          <p className="text-gray-400 text-sm">
            Create viral-worthy memes in seconds for your social media
          </p>
        </div>
        <MemeStudio />
      </div>
    </div>
  );
}
