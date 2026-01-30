'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AtSign, Link as LinkIcon, Image, Code, Sparkles, Users, Lock, Globe, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MentionAutocomplete } from './MentionAutocomplete';

const categories = [
  { id: '1', name: 'Gear Talk' },
  { id: '2', name: 'Production' },
  { id: '3', name: 'Listening Room' },
  { id: '4', name: 'Industry News' },
  { id: '5', name: 'General' },
];

interface ThreadComposerProps {
  onClose?: () => void;
}

export function ThreadComposer({ onClose }: ThreadComposerProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'members' | 'private'>('public');
  const [allowReplies, setAllowReplies] = useState(true);
  const [notifyOnReplies, setNotifyOnReplies] = useState(true);
  const [showAIAssist, setShowAIAssist] = useState(false);
  const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSaveDraft = async () => {
    if (!title.trim() && !body.trim()) {
      alert('Cannot save empty draft');
      return;
    }

    try {
      const response = await fetch('/api/forum/thread/save-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          categoryId,
          body,
          tags,
          visibility,
          allowReplies,
        }),
      });

      if (!response.ok) throw new Error('Failed to save draft');

      const data = await response.json();
      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Save draft error:', error);
      alert('Failed to save draft');
    }
  };

  const handlePostThread = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    if (!categoryId) {
      alert('Please select a category');
      return;
    }
    if (!body.trim()) {
      alert('Please enter thread content');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/forum/thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          categoryId,
          body,
          tags,
          visibility,
          allowReplies,
          notifyOnReplies,
        }),
      });

      if (!response.ok) throw new Error('Failed to create thread');

      const data = await response.json();
      alert('Thread posted successfully!');
      
      // Redirect to the new thread
      window.location.href = `/community/forum/thread/${data.threadId}`;
    } catch (error) {
      console.error('Post thread error:', error);
      alert('Failed to post thread');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && tags.length < 10) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setBody(value);

    // Check for @ mention trigger
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1 && cursorPosition - lastAtSymbol <= 20) {
      const query = textBeforeCursor.substring(lastAtSymbol + 1);
      if (!query.includes(' ')) {
        setMentionQuery(query);
        setShowMentionAutocomplete(true);
        
        // Calculate position for autocomplete
        const textarea = e.target;
        const rect = textarea.getBoundingClientRect();
        setMentionPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
      } else {
        setShowMentionAutocomplete(false);
      }
    } else {
      setShowMentionAutocomplete(false);
    }
  };

  const handleMentionSelect = (user: any) => {
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = body.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    const beforeMention = body.substring(0, lastAtSymbol);
    const afterMention = body.substring(cursorPosition);
    
    setBody(`${beforeMention}@${user.username} ${afterMention}`);
    setShowMentionAutocomplete(false);
    
    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = body.substring(0, start) + text + body.substring(end);
    
    setBody(newText);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 0);
  };

  const handleInsertLink = () => {
    if (linkUrl.trim()) {
      const linkMarkdown = linkText.trim() 
        ? `[${linkText}](${linkUrl})` 
        : linkUrl;
      insertAtCursor(linkMarkdown + ' ');
      setLinkUrl('');
      setLinkText('');
      setShowLinkDialog(false);
    }
  };

  const handleInsertMedia = () => {
    if (mediaUrl.trim()) {
      insertAtCursor(`\n![Image](${mediaUrl})\n`);
      setMediaUrl('');
      setShowMediaDialog(false);
    }
  };

  const handleInsertCodeSnippet = () => {
    insertAtCursor('\n```\n// Your code here\n```\n');
  };

  const handleDiscard = () => {
    if (title.trim() || body.trim()) {
      if (!confirm('Discard this thread? All unsaved changes will be lost.')) {
        return;
      }
    }
    if (onClose) {
      onClose();
    } else {
      router.push('/community/forum');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handleDiscard}
              className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-400 hover:text-white transition-colors"
              title="Discard and go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl sm:text-3xl font-bold text-white">Create New Thread</h1>
          </div>
          <button
            onClick={handleDiscard}
            className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
            title="Discard thread"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          <div className="lg:col-span-8 order-1">
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
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

                <div className="relative">
                  <Label htmlFor="body" className="text-sm font-semibold text-white mb-2 block">
                    Thread Body
                  </Label>
                  {showPreview ? (
                    <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 min-h-[300px] text-white">
                      <div className="prose prose-invert max-w-none">
                        {body.split('\n').map((paragraph, idx) => (
                          <p key={idx} className="mb-4 last:mb-0">
                            {paragraph.split(/(@\w+)/g).map((part, i) => 
                              part.startsWith('@') ? (
                                <span key={i} className="text-[#D7FF3C] font-medium">{part}</span>
                              ) : part.match(/\[([^\]]+)\]\(([^\)]+)\)/) ? (
                                <a 
                                  key={i}
                                  href={part.match(/\[([^\]]+)\]\(([^\)]+)\)/)?.[2] || '#'}
                                  className="text-blue-400 underline"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {part.match(/\[([^\]]+)\]\(([^\)]+)\)/)?.[1] || part}
                                </a>
                              ) : part.startsWith('```') ? (
                                <pre key={i} className="bg-[#0a0a0a] p-3 rounded-lg my-2 overflow-x-auto">
                                  <code>{part.replace(/```/g, '')}</code>
                                </pre>
                              ) : part.startsWith('![') ? (
                                <img 
                                  key={i}
                                  src={part.match(/!\[.*?\]\((.*?)\)/)?.[1] || ''}
                                  alt="Embedded image"
                                  className="max-w-full h-auto rounded-lg my-2"
                                />
                              ) : (
                                <span key={i}>{part}</span>
                              )
                            )}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <Textarea
                        ref={textareaRef}
                        id="body"
                        value={body}
                        onChange={handleBodyChange}
                        placeholder="Share your thoughts, questions, or insights... (Use @ to mention users)"
                        className="bg-[#111111] border-[#1a1a1a] text-white placeholder-gray-500 focus:border-[#D7FF3C] min-h-[300px] resize-none"
                        maxLength={10000}
                      />
                      {showMentionAutocomplete && (
                        <MentionAutocomplete
                          query={mentionQuery}
                          onSelect={handleMentionSelect}
                          onClose={() => setShowMentionAutocomplete(false)}
                          position={mentionPosition}
                        />
                      )}
                    </>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {body.length} / 10,000 characters
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1a1a1a]">
                  <button 
                    onClick={() => insertAtCursor('@')}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
                    title="Insert @ to mention a user"
                  >
                    <AtSign className="w-4 h-4" />
                    <span className="hidden sm:inline">Mention</span>
                  </button>
                  <button 
                    onClick={() => setShowLinkDialog(true)}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
                    title="Insert a link"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Link</span>
                  </button>
                  <button 
                    onClick={() => setShowMediaDialog(true)}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
                    title="Insert an image"
                  >
                    <Image className="w-4 h-4" />
                    <span className="hidden sm:inline">Media</span>
                  </button>
                  <button 
                    onClick={handleInsertCodeSnippet}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
                    title="Insert code snippet"
                  >
                    <Code className="w-4 h-4" />
                    <span className="hidden sm:inline">Snippet</span>
                  </button>
                  <button
                    onClick={() => setShowAIAssist(true)}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-[#D7FF3C]/10 hover:bg-[#D7FF3C]/20 text-[#D7FF3C] border border-[#D7FF3C]/30 rounded-lg text-xs sm:text-sm font-medium transition-colors ml-auto"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">AI Draft</span>
                  </button>
                </div>

                {/* Link Dialog */}
                {showLinkDialog && (
                  <div className="mt-4 p-4 bg-[#111111] border border-[#1a1a1a] rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-white">Insert Link</h4>
                      <button
                        onClick={() => setShowLinkDialog(false)}
                        className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-gray-400 mb-1 block">URL</Label>
                        <Input
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400 mb-1 block">Link Text (Optional)</Label>
                        <Input
                          value={linkText}
                          onChange={(e) => setLinkText(e.target.value)}
                          placeholder="Click here"
                          className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleInsertLink}
                          className="bg-[#D7FF3C] hover:bg-[#e7ff6f] text-black"
                          disabled={!linkUrl.trim()}
                        >
                          Insert Link
                        </Button>
                        <Button
                          onClick={() => setShowLinkDialog(false)}
                          variant="outline"
                          className="bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#2a2a2a]"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Media Dialog */}
                {showMediaDialog && (
                  <div className="mt-4 p-4 bg-[#111111] border border-[#1a1a1a] rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-white">Insert Image</h4>
                      <button
                        onClick={() => setShowMediaDialog(false)}
                        className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-gray-400 mb-1 block">Image URL</Label>
                        <Input
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleInsertMedia}
                          className="bg-[#D7FF3C] hover:bg-[#e7ff6f] text-black"
                          disabled={!mediaUrl.trim()}
                        >
                          Insert Image
                        </Button>
                        <Button
                          onClick={() => setShowMediaDialog(false)}
                          variant="outline"
                          className="bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#2a2a2a]"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

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

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 sm:pt-6 border-t border-[#1a1a1a]">
                  <button 
                    onClick={handleSaveDraft}
                    className="px-4 py-2 text-gray-400 hover:text-white text-xs sm:text-sm font-medium transition-colors order-3 sm:order-1"
                    disabled={isSubmitting}
                  >
                    Save as Draft
                  </button>
                  <div className="flex items-center gap-2 sm:gap-3 order-1 sm:order-2">
                    <button 
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white text-xs sm:text-sm font-medium rounded-lg transition-colors"
                      disabled={isSubmitting}
                    >
                      {showPreview ? 'Edit' : 'Preview'}
                    </button>
                    <Button 
                      onClick={handlePostThread}
                      className="flex-1 sm:flex-none bg-[#D7FF3C] hover:bg-[#e7ff6f] text-black font-semibold text-xs sm:text-sm"
                      disabled={isSubmitting || !title.trim() || !categoryId || !body.trim()}
                    >
                      {isSubmitting ? 'Posting...' : 'Post Thread'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 order-2">
            <div className="lg:sticky lg:top-6 space-y-4">
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide mb-3 sm:mb-4">
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
