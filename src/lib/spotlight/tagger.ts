
export function classifyTags(title:string, summary:string, source?:string) {
  const t = `${title} ${summary} ${source||""}`.toLowerCase();
  const out = new Set<string>();
  if (/\b(techno|house|minimal|garage|break|electro|ambient|idm|dubstep|trance)\b/.test(t)) out.add("scene");
  if (/\b(india|asia|tokyo|delhi|mumbai|bangalore|seoul|osaka|singapore)\b/.test(t)) out.add("asia");
  if (/\b(mix|podcast|dj set|ra.\s*podcast)\b/.test(t)) { out.add("podcasts"); out.add("mixes"); out.add("scene"); }
  if (/\bplaylist(s)?\b/.test(t)) out.add("playlists");
  if (/\b(ableton|bitwig|fl studio|logic|m4l|max for live)\b/.test(t)) { out.add("daw"); out.add("production"); out.add("tutorials"); }
  if (/\b(plugin|vst|au|aax|synth|eurorack|midi|sampler|808|909)\b/.test(t)) { out.add("plugins"); out.add("gear"); }
  if (/\b(review|hands[-\s]?on|first look|guide|how to|tutorial)\b/.test(t)) out.add("tutorials");
  if (/\b(kvr|update|release|beta|changelog)\b/.test(t)) out.add("updates");
  if (/\b(label|imprint)\b/.test(t)) out.add("labels");
  if (/\b(festival|event|gig|club night|lineup|tickets)\b/.test(t)) out.add("events");
  if (/\b(industry|business|royalties|publishing|catalog)\b/.test(t)) out.add("industry");
  return Array.from(out);
}
