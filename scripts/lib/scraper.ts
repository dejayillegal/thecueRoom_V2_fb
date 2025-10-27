import * as cheerio from 'cheerio';
import got from 'got';

export interface ScrapedFeedItem {
  title: string;
  link: string;
  summary?: string;
  image?: string;
  publishedAt?: Date;
}

export interface ScrapeConfig {
  listSelector?: string;
  titleSelector?: string;
  linkSelector?: string;
  imageSelector?: string;
  summarySelector?: string;
  dateSelector?: string;
}

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; thecueRoom/2.0; +https://thecueroom.com/bot)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
};

async function checkRobotsTxt(url: string): Promise<boolean> {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
    
    const response = await got(robotsUrl, {
      headers: DEFAULT_HEADERS,
      timeout: { request: 5000 },
      throwHttpErrors: false,
    });

    if (response.statusCode === 200) {
      const robotsTxt = response.body.toLowerCase();
      
      if (robotsTxt.includes('user-agent: *')) {
        const lines = robotsTxt.split('\n');
        for (const line of lines) {
          if (line.includes('disallow:') && line.includes(urlObj.pathname.split('/')[1])) {
            return false;
          }
        }
      }
    }
    
    return true;
  } catch (error) {
    return true;
  }
}

export async function extractImageFromPage(url: string): Promise<string | null> {
  try {
    const allowed = await checkRobotsTxt(url);
    if (!allowed) {
      console.log(`Robots.txt disallows scraping: ${url}`);
      return null;
    }

    const response = await got(url, {
      headers: DEFAULT_HEADERS,
      timeout: { request: 15000 },
      retry: { limit: 2 },
    });

    const $ = cheerio.load(response.body);

    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage && ogImage.startsWith('http')) {
      return ogImage;
    }

    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    if (twitterImage && twitterImage.startsWith('http')) {
      return twitterImage;
    }

    const metaImage = $('meta[itemprop="image"]').attr('content');
    if (metaImage && metaImage.startsWith('http')) {
      return metaImage;
    }

    const linkImage = $('link[rel="image_src"]').attr('href');
    if (linkImage && linkImage.startsWith('http')) {
      return linkImage;
    }

    const firstImg = $('article img, .post img, .entry img, main img').first().attr('src');
    if (firstImg) {
      try {
        return firstImg.startsWith('http') ? firstImg : new URL(firstImg, url).href;
      } catch {
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error(`Failed to extract image from ${url}:`, error);
    return null;
  }
}

export async function scrapeFeed(url: string, config: ScrapeConfig): Promise<ScrapedFeedItem[]> {
  try {
    const allowed = await checkRobotsTxt(url);
    if (!allowed) {
      throw new Error(`Scraping disallowed by robots.txt for ${url}`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await got(url, {
      headers: DEFAULT_HEADERS,
      timeout: { request: 20000 },
      retry: { limit: 3 },
    });

    const $ = cheerio.load(response.body);
    const items: ScrapedFeedItem[] = [];

    const listElements = $(config.listSelector || 'article, .post, .entry');

    listElements.slice(0, 20).each((_, element) => {
      try {
        const $el = $(element);

        let title = '';
        if (config.titleSelector) {
          title = $el.find(config.titleSelector).first().text().trim();
        } else {
          title = $el.find('h1, h2, h3, .title, .post-title').first().text().trim();
        }

        let link = '';
        if (config.linkSelector) {
          link = $el.find(config.linkSelector).first().attr('href') || '';
        } else {
          link = $el.find('a').first().attr('href') || '';
        }

        if (!link.startsWith('http')) {
          link = new URL(link, url).href;
        }

        let image = '';
        if (config.imageSelector) {
          image = $el.find(config.imageSelector).first().attr('src') || '';
        } else {
          image = $el.find('img').first().attr('src') || '';
        }

        if (image && !image.startsWith('http')) {
          image = new URL(image, url).href;
        }

        let summary = '';
        if (config.summarySelector) {
          summary = $el.find(config.summarySelector).first().text().trim();
        } else {
          summary = $el.find('p, .excerpt, .summary').first().text().trim();
        }

        if (title && link) {
          items.push({
            title,
            link,
            summary: summary || undefined,
            image: image || undefined,
            publishedAt: new Date(),
          });
        }
      } catch (itemError) {
        console.error('Error processing item:', itemError);
      }
    });

    return items;
  } catch (error: any) {
    throw new Error(`Failed to scrape ${url}: ${error.message}`);
  }
}
