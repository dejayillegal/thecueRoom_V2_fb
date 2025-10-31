import { notFound } from 'next/navigation';
import { promises as fs } from 'fs';
import path from 'path';
import sanitizeHtml from 'sanitize-html';

interface ShareRecord {
  shareId: string;
  jobId: string;
  artistName?: string;
  releaseTitle?: string;
  createdAt: number;
  expiresAt: number;
  accessCount: number;
}

interface SharesData {
  shares: Record<string, ShareRecord>;
}

interface EPKJob {
  jobId: string;
  status: string;
  progress: number;
  resultUrl?: string;
  error?: string;
  templateId?: string;
  modules?: any[];
  artistName?: string;
  releaseTitle?: string;
  includeWatermark?: boolean;
}

async function getShare(shareId: string): Promise<ShareRecord | null> {
  try {
    const sharesFile = path.join(process.cwd(), '.local/state/epk-shares.json');
    const data = await fs.readFile(sharesFile, 'utf-8');
    const sharesData: SharesData = JSON.parse(data);
    
    const share = sharesData.shares[shareId];
    
    if (!share || share.expiresAt < Date.now()) {
      return null;
    }
    
    return share;
  } catch (error) {
    console.error('[EPK Share Page] Error loading share:', error);
    return null;
  }
}

async function getJobMeta(jobId: string): Promise<EPKJob | null> {
  try {
    const tempDir = process.env.EPK_TEMP_DIR || '/tmp/thecueroom-epk';
    const metaPath = path.join(tempDir, `${jobId}.json`);
    const data = await fs.readFile(metaPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[EPK Share Page] Error loading job:', error);
    return null;
  }
}

const sanitizeConfig = {
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a'],
  allowedAttributes: {
    'a': ['href', 'target', 'rel']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    'a': (tagName: string, attribs: any) => ({
      tagName: 'a',
      attribs: {
        href: attribs.href,
        target: '_blank',
        rel: 'noopener noreferrer'
      }
    })
  }
};

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return url;
    }
    return '';
  } catch {
    return '';
  }
}

function generatePreviewHTML(job: EPKJob): string {
  const { modules = [] } = job;
  
  let modulesHTML = '';
  
  modules.forEach((module: any) => {
    switch (module.type) {
      case 'bio':
        const bioText = sanitizeHtml(module.data?.text || '', sanitizeConfig);
        modulesHTML += `
          <section class="module">
            <h2>Biography</h2>
            <div class="bio-text">${bioText}</div>
          </section>
        `;
        break;
      case 'quotes':
        modulesHTML += `
          <section class="module">
            <h2>Press Quotes</h2>
            <div class="quotes">
              ${(module.data?.quotes || []).map((q: any) => {
                const quoteText = sanitizeHtml(q.text || '', sanitizeConfig);
                return `<blockquote class="quote">${quoteText}</blockquote>`;
              }).join('')}
            </div>
          </section>
        `;
        break;
      case 'tracklist':
        modulesHTML += `
          <section class="module">
            <h2>Tracklist</h2>
            <div class="tracklist">
              ${(module.data?.tracks || []).map((track: any, idx: number) => {
                const title = escapeHtml(track.title || 'Untitled');
                return `
                  <div class="track-item">
                    <span class="track-number">${idx + 1}.</span>
                    <span class="track-title">${title}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </section>
        `;
        break;
      case 'techRider':
        modulesHTML += `
          <section class="module">
            <h2>Tech Rider</h2>
            <div class="tech-rider">
              ${(module.data?.items || []).map((item: any) => {
                const label = escapeHtml(item.label || '');
                const qty = item.quantity ? parseInt(item.quantity) : 0;
                return `
                  <div class="tech-item">
                    <span class="tech-label">${label}</span>
                    ${qty > 0 ? `<span class="tech-qty">×${qty}</span>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </section>
        `;
        break;
      case 'links':
        modulesHTML += `
          <section class="module">
            <h2>Links</h2>
            <div class="links">
              ${Object.entries(module.data?.links || {}).map(([platform, url]) => {
                const safePlatform = escapeHtml(platform);
                const safeUrl = sanitizeUrl(url as string);
                return safeUrl ? `<a href="${safeUrl}" class="link-item" target="_blank" rel="noopener noreferrer">${safePlatform}</a>` : '';
              }).join('')}
            </div>
          </section>
        `;
        break;
    }
  });

  return modulesHTML;
}

export default async function EPKSharePage({
  params,
}: {
  params: { shareId: string };
}) {
  const share = await getShare(params.shareId);
  
  if (!share) {
    notFound();
  }

  const job = await getJobMeta(share.jobId);
  
  if (!job) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-white flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">EPK Not Found</h1>
          <p className="text-gray-400">This EPK is no longer available.</p>
        </div>
      </div>
    );
  }

  const artistName = escapeHtml(share.artistName || job.artistName || 'Artist Name');
  const releaseTitle = share.releaseTitle || job.releaseTitle;
  const releaseTitleSafe = releaseTitle ? escapeHtml(releaseTitle) : '';
  const previewContent = generatePreviewHTML(job);
  const downloadUrl = job.resultUrl;

  const ogTitle = escapeHtml(`${share.artistName || job.artistName}${releaseTitle ? ` - ${releaseTitle}` : ''} | Electronic Press Kit`);
  const ogDescription = escapeHtml(`View the electronic press kit for ${share.artistName || job.artistName}`);

  return (
    <>
      <head>
        <title>{ogTitle}</title>
        <meta name="description" content={ogDescription} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
      </head>
      
      <div className="min-h-screen bg-[#0B0B0B] text-white">
        <div className="max-w-4xl mx-auto p-8">
          <header className="mb-12 text-center">
            <h1 className="text-5xl font-bold mb-4" style={{ color: '#D7FF3C' }}>
              {artistName}
            </h1>
            {releaseTitleSafe && (
              <h2 className="text-2xl" style={{ color: '#9B5CFF' }}>
                {releaseTitleSafe}
              </h2>
            )}
            <div className="mt-6 flex gap-4 justify-center">
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  className="px-6 py-3 rounded-lg font-semibold transition-all"
                  style={{
                    backgroundColor: '#D7FF3C',
                    color: '#0B0B0B',
                  }}
                  download
                >
                  Download PDF
                </a>
              )}
            </div>
          </header>

          <div 
            className="epk-content"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />

          <footer className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            <p>Created with thecueRoom</p>
            <p className="mt-2">Share expires: {new Date(share.expiresAt).toLocaleDateString()}</p>
          </footer>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .epk-content .module {
            margin-bottom: 3rem;
          }

          .epk-content .module h2 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #D7FF3C;
            margin-bottom: 1.5rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .epk-content .bio-text {
            font-size: 1rem;
            line-height: 1.8;
            color: #E5E5E5;
          }

          .epk-content .quotes {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .epk-content .quote {
            padding: 1.5rem;
            background: #1a1a1a;
            border-left: 4px solid #9B5CFF;
            border-radius: 0.5rem;
            font-style: italic;
            color: #E5E5E5;
          }

          .epk-content .tracklist {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .epk-content .track-item {
            display: flex;
            gap: 1rem;
            padding: 1rem;
            background: #1a1a1a;
            border-radius: 0.5rem;
            align-items: center;
          }

          .epk-content .track-number {
            color: #9B5CFF;
            font-weight: 600;
            min-width: 2rem;
          }

          .epk-content .track-title {
            color: #E5E5E5;
          }

          .epk-content .tech-rider {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
          }

          .epk-content .tech-item {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: #9B5CFF;
            border-radius: 2rem;
            font-weight: 600;
          }

          .epk-content .tech-qty {
            opacity: 0.8;
            font-size: 0.875rem;
          }

          .epk-content .links {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
          }

          .epk-content .link-item {
            padding: 0.75rem 1.5rem;
            background: #1a1a1a;
            border: 2px solid #D7FF3C;
            border-radius: 0.5rem;
            color: #D7FF3C;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.2s;
            text-transform: capitalize;
          }

          .epk-content .link-item:hover {
            background: #D7FF3C;
            color: #0B0B0B;
          }
        ` }} />
      </div>
    </>
  );
}
