'use client';

import { useState } from 'react';
import { AtSign, Link as LinkIcon, Image, Code, Sparkles, CheckCircle2, Eye, EyeOff, Users, Lock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const categories = [
  { id: '1', name: 'Gear Talk' },
  { id: '2', name: 'Production' },
  { id: '3', name: 'Listening Room' },
  { id: '4', name: 'Industry News' },
  { id: '5', name: 'General' },
];

export function ThreadComposer() {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'members' | 'private'>('public');
  const [allowReplies, setAllowReplies] = useState(true);
  const [notifyOnReplies, setNotifyOnReplies] = useState(true);
  const [showAIAssist, setShowAIAssist] = useState(false);

  const addTag = () => {
    if (tagInput.trim() && tags.length < 10) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-white mb-6">Create New Thread</h1>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="title" className="text-sm font-semibold text-white mb-2 block">
                    Thread Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What's your question or topic?"
                    className="bg-[#111111] border-[#1a1a1a] text-white placeholder-gray-500 focus:border-[#D7FF3C]"
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {title.length} / 200 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="category" className="text-sm font-semibold text-white mb-2 block">
                    Category
                  </Label>
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2 bg-[#111111] border border-[#1a1a1a] rounded-lg text-white focus:outline-none focus:border-[#D7FF3C]"
                  >
                    <option value="">Select a category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="body" className="text-sm font-semibold text-white mb-2 block">
                    Thread Body
                  </Label>
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Share your thoughts, questions, or insights..."
                    className="bg-[#111111] border-[#1a1a1a] text-white placeholder-gray-500 focus:border-[#D7FF3C] min-h-[300px] resize-none"
                    maxLength={10000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {body.length} / 10,000 characters
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#1a1a1a]">
                  <button className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-lg text-sm font-medium transition-colors">
                    <AtSign className="w-4 h-4" />
                    Mention
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-lg text-sm font-medium transition-colors">
                    <LinkIcon className="w-4 h-4" />
                    Link
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-lg text-sm font-medium transition-colors">
                    <Image className="w-4 h-4" />
                    Media
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-lg text-sm font-medium transition-colors">
                    <Code className="w-4 h-4" />
                    Snippet
                  </button>
                  <button
                    onClick={() => setShowAIAssist(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#D7FF3C]/10 hover:bg-[#D7FF3C]/20 text-[#D7FF3C] border border-[#D7FF3C]/30 rounded-lg text-sm font-medium transition-colors ml-auto"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Draft
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 rounded-lg text-sm font-medium transition-colors">
                    <CheckCircle2 className="w-4 h-4" />
                    Verify Artist
                  </button>
                </div>

                <div>
                  <Label htmlFor="tags" className="text-sm font-semibold text-white mb-2 block">
                    Tags (max 10)
                  </Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add a tag..."
                      className="bg-[#111111] border-[#1a1a1a] text-white placeholder-gray-500 focus:border-[#D7FF3C]"
                      disabled={tags.length >= 10}
                    />
                    <Button
                      onClick={addTag}
                      variant="outline"
                      className="bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#2a2a2a]"
                      disabled={tags.length >= 10 || !tagInput.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 rounded-full text-xs"
                        >
                          #{tag}
                          <button
                            onClick={() => removeTag(index)}
                            className="hover:text-red-500 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-[#1a1a1a]">
                  <button className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium transition-colors">
                    Save as Draft
                  </button>
                  <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white text-sm font-medium rounded-lg transition-colors">
                      Preview
                    </button>
                    <Button className="bg-[#D7FF3C] hover:bg-[#e7ff6f] text-black font-semibold">
                      Post Thread
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-4">
            <div className="sticky top-6 space-y-4">
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">
                  Thread Settings
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-300 mb-2 block">
                      Visibility
                    </Label>
                    <div className="space-y-2">
                      <button
                        onClick={() => setVisibility('public')}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-lg border transition-all
                          ${visibility === 'public' 
                            ? 'bg-[#D7FF3C]/10 border-[#D7FF3C]/30 text-[#D7FF3C]' 
                            : 'bg-[#111111] border-[#1a1a1a] text-gray-400 hover:border-[#2a2a2a]'
                          }
                        `}
                      >
                        <Globe className="w-4 h-4" />
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium">Public</div>
                          <div className="text-xs opacity-70">Anyone can view</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setVisibility('members')}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-lg border transition-all
                          ${visibility === 'members' 
                            ? 'bg-[#D7FF3C]/10 border-[#D7FF3C]/30 text-[#D7FF3C]' 
                            : 'bg-[#111111] border-[#1a1a1a] text-gray-400 hover:border-[#2a2a2a]'
                          }
                        `}
                      >
                        <Users className="w-4 h-4" />
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium">Members Only</div>
                          <div className="text-xs opacity-70">Logged-in users</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setVisibility('private')}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-lg border transition-all
                          ${visibility === 'private' 
                            ? 'bg-[#D7FF3C]/10 border-[#D7FF3C]/30 text-[#D7FF3C]' 
                            : 'bg-[#111111] border-[#1a1a1a] text-gray-400 hover:border-[#2a2a2a]'
                          }
                        `}
                      >
                        <Lock className="w-4 h-4" />
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium">Private</div>
                          <div className="text-xs opacity-70">Only mentioned users</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#1a1a1a] space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-gray-300">Allow Replies</span>
                      <input
                        type="checkbox"
                        checked={allowReplies}
                        onChange={(e) => setAllowReplies(e.target.checked)}
                        className="w-4 h-4 rounded bg-[#111111] border-[#1a1a1a] text-[#D7FF3C] focus:ring-[#D7FF3C] focus:ring-offset-0"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-gray-300">Notify on Replies</span>
                      <input
                        type="checkbox"
                        checked={notifyOnReplies}
                        onChange={(e) => setNotifyOnReplies(e.target.checked)}
                        className="w-4 h-4 rounded bg-[#111111] border-[#1a1a1a] text-[#D7FF3C] focus:ring-[#D7FF3C] focus:ring-offset-0"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-3">
                  Posting Guidelines
                </h3>
                <ul className="space-y-2 text-xs text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-[#D7FF3C] mt-0.5">✓</span>
                    <span>Use descriptive titles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D7FF3C] mt-0.5">✓</span>
                    <span>Add relevant tags</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D7FF3C] mt-0.5">✓</span>
                    <span>Be respectful and constructive</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D7FF3C] mt-0.5">✓</span>
                    <span>Search before posting duplicates</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
