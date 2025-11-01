
const { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } = require('fs');
const { join } = require('path');
const sharp = require('sharp');
const QRCode = require('qrcode');

const AI_TEMP_DIR = process.env.AI_TEMP_DIR || '/tmp/thecueroom-ai';
const AI_PROVIDER = process.env.AI_PROVIDER || 'none';
const HF_TOKEN = process.env.HF_TOKEN;
const CONCURRENCY = parseInt(process.env.AI_WORKER_CONCURRENCY || '2');
const VERIFY_QUEUE = './.local/gigs/verify_queue.jsonl';
const TICKET_QUEUE = './.local/gigs/ticket_queue.jsonl';

const TRUSTED_DOMAINS = ['rollingstoneindia.com', 'bandcamp.com', 'soundcloud.com'];

mkdirSync(AI_TEMP_DIR, { recursive: true });

// Heuristics-based verification (free, deterministic)
async function verifyEventHeuristics(event) {
  const evidence = {
    checks: [],
    score: 0,
    reasoning: []
  };
  
  // Check 1: Date validation
  const eventDate = new Date(event.date);
  const now = new Date();
  if (eventDate > now) {
    evidence.score += 20;
    evidence.checks.push('valid_future_date');
    evidence.reasoning.push('Event date is in the future');
  } else {
    evidence.reasoning.push('⚠️ Event date is in the past');
  }
  
  // Check 2: Required fields present
  if (event.title && event.venue && event.date) {
    evidence.score += 15;
    evidence.checks.push('required_fields');
    evidence.reasoning.push('All required fields present');
  }
  
  // Check 3: Ticket URL validation
  if (event.ticketUrl) {
    try {
      const url = new URL(event.ticketUrl);
      const response = await fetch(event.ticketUrl, { method: 'HEAD', timeout: 5000 });
      if (response.ok) {
        evidence.score += 25;
        evidence.checks.push('valid_ticket_url');
        evidence.reasoning.push('Ticket URL is accessible');
        
        // Bonus for trusted domains
        if (TRUSTED_DOMAINS.some(d => url.hostname.includes(d))) {
          evidence.score += 15;
          evidence.checks.push('trusted_domain');
          evidence.reasoning.push('Ticket URL from trusted domain');
        }
      }
    } catch (error) {
      evidence.reasoning.push('⚠️ Could not verify ticket URL');
    }
  }
  
  // Check 4: Description quality
  if (event.description && event.description.length > 50) {
    evidence.score += 10;
    evidence.checks.push('detailed_description');
    evidence.reasoning.push('Detailed description provided');
  }
  
  // Check 5: Image provided
  if (event.imageUrl) {
    evidence.score += 10;
    evidence.checks.push('has_image');
    evidence.reasoning.push('Event image provided');
  }
  
  // Check 6: Location details
  if (event.region && event.address) {
    evidence.score += 5;
    evidence.checks.push('location_details');
    evidence.reasoning.push('Complete location information');
  }
  
  // Determine decision
  let decision;
  if (evidence.score >= 85) {
    decision = 'auto_approve';
  } else if (evidence.score >= 60) {
    decision = 'needs_manual_review';
  } else {
    decision = 'suspect';
  }
  
  return {
    decision,
    score: evidence.score,
    evidence,
    provider: 'heuristics'
  };
}

// Optional HF inference (if configured)
async function verifyEventHF(event, heuristicsResult) {
  if (AI_PROVIDER !== 'hf' || !HF_TOKEN) {
    return heuristicsResult;
  }
  
  try {
    const prompt = `Verify this event submission:
Title: ${event.title}
Venue: ${event.venue}
Date: ${event.date}
Ticket: ${event.ticketUrl || 'N/A'}

Heuristic checks: ${heuristicsResult.evidence.checks.join(', ')}
Heuristic score: ${heuristicsResult.score}/100

Is this a legitimate event? Respond with: APPROVE, REVIEW, or DENY`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-mnli', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: prompt }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.log('⚠️ HF API error, using heuristics');
      return heuristicsResult;
    }
    
    const data = await response.json();
    
    // Merge HF insights with heuristics
    return {
      ...heuristicsResult,
      provider: 'heuristics+hf',
      hf_insight: data
    };
  } catch (error) {
    console.log('⚠️ HF verification failed, using heuristics:', error.message);
    return heuristicsResult;
  }
}

// Ticket rendering with sharp streaming
async function renderTicket(ticket) {
  const { eventId, userId, ticketId } = ticket;
  
  // Generate QR code
  const qrDataUrl = await QRCode.toDataURL(
    JSON.stringify({
      ticketId,
      eventId,
      userId,
      verifyUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/api/gigs/ticket/verify/${ticketId}`
    }),
    { width: 200, margin: 1 }
  );
  
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
  
  // Create ticket template with sharp (streaming)
  const ticketWidth = 1024;
  const ticketHeight = 512;
  
  const svgTemplate = `
    <svg width="${ticketWidth}" height="${ticketHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#D7FF3C;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#9B5CFF;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" />
      <rect x="20" y="20" width="${ticketWidth - 40}" height="${ticketHeight - 40}" fill="#0b0b0b" rx="10" />
      <text x="40" y="80" font-family="Arial" font-size="32" font-weight="bold" fill="#D7FF3C">
        ${ticket.eventTitle || 'Event Ticket'}
      </text>
      <text x="40" y="120" font-family="Arial" font-size="18" fill="#ffffff">
        ${ticket.venue || 'Venue TBA'}
      </text>
      <text x="40" y="150" font-family="Arial" font-size="16" fill="#999">
        ${ticket.date || 'Date TBA'}
      </text>
      <text x="40" y="${ticketHeight - 60}" font-family="Arial" font-size="14" fill="#666">
        Ticket ID: ${ticketId.substring(0, 12)}...
      </text>
    </svg>
  `;
  
  const outputPath = join(AI_TEMP_DIR, `${ticketId}.png`);
  
  // Stream SVG to PNG
  await sharp(Buffer.from(svgTemplate))
    .resize(ticketWidth, ticketHeight)
    .composite([{
      input: qrBuffer,
      top: ticketHeight - 240,
      left: ticketWidth - 240
    }])
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
  
  return outputPath;
}

// Process verification jobs
async function processVerificationJob(job) {
  const { jobId, eventId, payload } = job;
  
  console.log(`🔍 Verifying event: ${eventId}`);
  
  try {
    // Run heuristics
    const heuristicsResult = await verifyEventHeuristics(payload);
    
    // Optionally enhance with HF
    const finalResult = await verifyEventHF(payload, heuristicsResult);
    
    // Save result
    const resultPath = join(AI_TEMP_DIR, `${jobId}.json`);
    writeFileSync(resultPath, JSON.stringify({
      jobId,
      eventId,
      ...finalResult,
      completedAt: new Date()
    }, null, 2));
    
    console.log(`✅ ${eventId}: ${finalResult.decision} (score: ${finalResult.score})`);
    
    return finalResult;
  } catch (error) {
    console.error(`❌ Verification failed for ${eventId}:`, error);
    throw error;
  }
}

// Process ticket rendering jobs
async function processTicketJob(job) {
  const { jobId, payload } = job;
  
  console.log(`🎫 Rendering ticket: ${jobId}`);
  
  try {
    const ticketPath = await renderTicket(payload);
    
    const resultPath = join(AI_TEMP_DIR, `${jobId}.json`);
    writeFileSync(resultPath, JSON.stringify({
      jobId,
      ticketPath,
      downloadUrl: `/api/gigs/ticket/download/${payload.ticketId}`,
      completedAt: new Date()
    }, null, 2));
    
    console.log(`✅ Ticket rendered: ${ticketPath}`);
    
    return { ticketPath };
  } catch (error) {
    console.error(`❌ Ticket rendering failed:`, error);
    throw error;
  }
}

// Main worker loop
async function runWorker() {
  console.log('[AI Worker] Starting...');
  console.log(`[AI Worker] Concurrency: ${CONCURRENCY}`);
  console.log(`[AI Worker] AI Provider: ${AI_PROVIDER}`);
  console.log(`[AI Worker] Temp Dir: ${AI_TEMP_DIR}`);
  
  let running = true;
  
  while (running) {
    try {
      // Process verification queue
      if (existsSync(VERIFY_QUEUE)) {
        const lines = readFileSync(VERIFY_QUEUE, 'utf-8').trim().split('\n').filter(Boolean);
        writeFileSync(VERIFY_QUEUE, ''); // Clear queue
        
        for (const line of lines.slice(0, CONCURRENCY)) {
          try {
            const job = JSON.parse(line);
            await processVerificationJob(job);
          } catch (error) {
            console.error('Job processing error:', error);
          }
        }
      }
      
      // Process ticket queue
      if (existsSync(TICKET_QUEUE)) {
        const lines = readFileSync(TICKET_QUEUE, 'utf-8').trim().split('\n').filter(Boolean);
        writeFileSync(TICKET_QUEUE, ''); // Clear queue
        
        for (const line of lines.slice(0, CONCURRENCY)) {
          try {
            const job = JSON.parse(line);
            await processTicketJob(job);
          } catch (error) {
            console.error('Ticket job error:', error);
          }
        }
      }
      
      // Sleep
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error('[Worker] Error:', error);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}

if (require.main === module) {
  runWorker().catch(err => {
    console.error('[Worker] Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { processVerificationJob, processTicketJob, renderTicket };
