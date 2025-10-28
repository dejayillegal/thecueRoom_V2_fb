
import Parser from 'rss-parser';
import pLimit from 'p-limit';
import { getDbClient } from '@thecueroom/db/client';
import { feeds, sources } from '@thecueroom/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import crypto from 'crypto';

const parser = new Parser({
  timeout: 15000,
  headers: { 
    'User-Agent': 'Mozilla/5.0 (compatible; thecueRoom/2.0; +https://thecueroom.com)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  },
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'content:encoded'],
    ],
  },
});

const IMAGE_TIMEOUT = 8000;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

interface ImageExtractionResult {
  url: string | null;
  source: 'enclosure' | 'media' | 'og' | 'twitter' | 'content' | 'page-scrape' | 'fallback';
}

async function validateImageUrl(url: string): Promise<boolean> {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    
    // Only allow http/https
    if (!['http:', 'https:'].includes(urlObj.protocol)) return false;
    
    // Block video embeds
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) {
      return false;
    }
    
    // Validate with HEAD request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), IMAGE_TIMEOUT);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; thecueRoom/2.0; +https://thecueroom.com)',
      },
    }).catch(() => null);
    
    clearTimeout(timeout);
    
    if (!response || !response.ok) return false;
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) return false;
    
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE) return false;
    
    return true;
  } catch {
    return false;
  }
}

async function extractImageFromPage(pageUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; thecueRoom/2.0; +https://thecueroom.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    }).catch(() => null);
    
    clearTimeout(timeout);
    
    if (!response || !response.ok) return null;
    
    const html = await response.text();
    
    // Try og:image
    const ogMatch = html.match(/<meta\s+property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogMatch?.[1]) {
      const ogUrl = ogMatch[1].startsWith('http') ? ogMatch[1] : new URL(ogMatch[1], pageUrl).href;
      if (await validateImageUrl(ogUrl)) return ogUrl;
    }
    
    // Try twitter:image
    const twitterMatch = html.match(/<meta\s+name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
    if (twitterMatch?.[1]) {
      const twitterUrl = twitterMatch[1].startsWith('http') ? twitterMatch[1] : new URL(twitterMatch[1], pageUrl).href;
      if (await validateImageUrl(twitterUrl)) return twitterUrl;
    }
    
    // Try first img in article/main content
    const imgMatch = html.match(/<(?:article|main|div[^>]*class=["'][^"']*(?:post|entry|article|content)[^"']*["'])[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch?.[1]) {
      const imgUrl = imgMatch[1].startsWith('http') ? imgMatch[1] : new URL(imgMatch[1], pageUrl).href;
      if (await validateImageUrl(imgUrl)) return imgUrl;
    }
    
    return null;
  } catch (error) {
    console.error(`Page scrape failed for ${pageUrl}:`, error);
    return null;
  }
}

async function extractImageAdvanced(item: any, baseUrl: string, itemLink: string): Promise<ImageExtractionResult> {
  const makeAbsolute = (url: string) => {
    try {
      return url.startsWith('http') ? url : new URL(url, baseUrl).href;
    } catch {
      return null;
    }
  };

  // 1. Try enclosure (RSS standard)
  if (item.enclosure?.url) {
    const encUrl = makeAbsolute(item.enclosure.url);
    if (encUrl && /\.(jpg|jpeg|png|gif|webp|avif)(\?.*)?$/i.test(encUrl)) {
      if (await validateImageUrl(encUrl)) {
        return { url: encUrl, source: 'enclosure' };
      }
    }
  }

  // 2. Try media:content (Media RSS)
  if (item['media:content']?.$?.url) {
    const mediaUrl = makeAbsolute(item['media:content'].$.url);
    if (mediaUrl && await validateImageUrl(mediaUrl)) {
      return { url: mediaUrl, source: 'media' };
    }
  }

  // 3. Try media:thumbnail
  if (item['media:thumbnail']?.$?.url) {
    const thumbUrl = makeAbsolute(item['media:thumbnail'].$.url);
    if (thumbUrl && await validateImageUrl(thumbUrl)) {
      return { url: thumbUrl, source: 'media' };
    }
  }

  // 4. Try explicit image field
  if (item.image?.url) {
    const imgUrl = makeAbsolute(item.image.url);
    if (imgUrl && await validateImageUrl(imgUrl)) {
      return { url: imgUrl, source: 'media' };
    }
  }

  // 5. Extract from content/description
  const content = item['content:encoded'] || item.content || item.description || '';
  
  if (content) {
    // Try og:image in content
    const ogMatch = content.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogMatch?.[1]) {
      const ogUrl = makeAbsolute(ogMatch[1]);
      if (ogUrl && await validateImageUrl(ogUrl)) {
        return { url: ogUrl, source: 'og' };
      }
    }

    // Try twitter:image in content
    const twitterMatch = content.match(/name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
    if (twitterMatch?.[1]) {
      const twitterUrl = makeAbsolute(twitterMatch[1]);
      if (twitterUrl && await validateImageUrl(twitterUrl)) {
        return { url: twitterUrl, source: 'twitter' };
      }
    }

    // Try img tags in content
    const imgMatches = content.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
    for (const match of imgMatches) {
      const imgUrl = makeAbsolute(match[1]);
      if (imgUrl && await validateImageUrl(imgUrl)) {
        return { url: imgUrl, source: 'content' };
      }
    }
  }

  // 6. Scrape the actual page (last resort)
  if (itemLink) {
    console.log(`  🔍 Scraping page for image: ${itemLink.slice(0, 60)}...`);
    const scrapedUrl = await extractImageFromPage(itemLink);
    if (scrapedUrl) {
      return { url: scrapedUrl, source: 'page-scrape' };
    }
  }

  // 7. Fallback to generated image
  return { url: null, source: 'fallback' };
}

function generateHash(title: string, link: string): string {
  return crypto
    .createHash('sha256')
    .update(`${title}|${link}`)
    .digest('hex');
}

function cleanText(html: string): string {
  if (!html) return '';
  
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function ingestSource(source: any) {
  try {
    console.log(`📥 Fetching RSS: ${source.name}`);
    const startTime = Date.now();
    
    const feed = await parser.parseURL(source.url);
    const db = getDbClient();

    let imported = 0;
    let skipped = 0;
    const imageStats = {
      enclosure: 0,
      media: 0,
      og: 0,
      twitter: 0,
      content: 0,
      'page-scrape': 0,
      fallback: 0,
    };

    const limit = pLimit(3); // Process 3 items concurrently for image validation

    const promises = feed.items.slice(0, source.maxItems || 50).map(item =>
      limit(async () => {
        try {
          const title = cleanText(item.title || '');
          const link = item.link || '';
          const summary = cleanText(item.contentSnippet || item.description || '').slice(0, 500);
          
          if (!title || !link) return;

          const hash = generateHash(title, link);
          
          // Check for duplicates
          const existing = await db
            .select()
            .from(feeds)
            .where(and(eq(feeds.hash, hash), eq(feeds.sourceId, source.id)))
            .limit(1);

          if (existing.length > 0) {
            skipped++;
            return;
          }

          // Extract image with advanced validation
          const imageResult = await extractImageAdvanced(item, source.url, link);
          const imageUrl = imageResult.url || `/api/og-fallback?title=${encodeURIComponent(title.slice(0, 120))}`;
          
          imageStats[imageResult.source]++;

          let publishedAt: Date;
          try {
            publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
          } catch {
            publishedAt = new Date();
          }

          await db.insert(feeds).values({
            title,
            url: link,
            summary,
            image: imageUrl,
            publishedAt,
            sourceId: source.id,
            hash,
            tags: source.tags || [],
          });

          imported++;
        } catch (error) {
          console.error(`  ❌ Error processing item: ${error}`);
        }
      })
    );

    await Promise.all(promises);

    const duration = Date.now() - startTime;
    
    console.log(`✅ ${source.name}: ${imported} new, ${skipped} duplicates (${duration}ms)`);
    console.log(`   📊 Image sources: ${Object.entries(imageStats).filter(([_, count]) => count > 0).map(([src, count]) => `${src}:${count}`).join(', ')}`);

    return { success: true, imported, skipped };
  } catch (error: any) {
    console.error(`❌ ${source.name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export async function ingestBatch(sourcesToIngest: any[], concurrency: number = 5) {
  const limit = pLimit(concurrency);
  let totalImported = 0;
  let totalSkipped = 0;
  let successful = 0;
  let failed = 0;
  const errors: Array<{ source: string; error: string }> = [];

  const promises = sourcesToIngest.map(source =>
    limit(async () => {
      const result = await ingestSource(source);
      if (result.success) {
        successful++;
        totalImported += result.imported || 0;
        totalSkipped += result.skipped || 0;
      } else {
        failed++;
        errors.push({ source: source.name, error: result.error || 'Unknown error' });
      }
    })
  );

  await Promise.all(promises);

  return { successful, failed, totalImported, totalSkipped, errors };
}

export async function runWorker() {
  console.log('🚀 thecueRoom Enhanced Feed Ingestion\n');
  console.log('============================================\n');

  const db = getDbClient();
  
  const allSources = await db
    .select()
    .from(sources)
    .where(eq(sources.enabled, true));

  if (allSources.length === 0) {
    console.log('⚠️  No enabled sources found in database.');
    return { success: false, message: 'No enabled sources' };
  }

  console.log(`📊 Processing ${allSources.length} sources with enhanced image extraction...\n`);

  const startTime = Date.now();
  const results = await ingestBatch(allSources, 5);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n============================================');
  console.log('📈 Ingestion Summary');
  console.log('============================================');
  console.log(`✅ Successful: ${results.successful}/${allSources.length}`);
  console.log(`❌ Failed: ${results.failed}/${allSources.length}`);
  console.log(`📝 Total items imported: ${results.totalImported}`);
  console.log(`⏭️  Total duplicates skipped: ${results.totalSkipped}`);
  console.log(`⏱️  Duration: ${duration}s`);

  if (results.errors.length > 0) {
    console.log('\n❌ Failed Sources:');
    results.errors.forEach(({ source, error }) => {
      console.log(`   - ${source}: ${error}`);
    });
  }

  console.log('\n✨ Enhanced ingestion complete!\n');
  
  return {
    success: true,
    message: `Processed ${allSources.length} sources`,
    results,
  };
}
