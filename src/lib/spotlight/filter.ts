const DROP = [
  /taylor swift|drake|bieber|beyoncé|bts|olivia rodrigo|ariana grande/i,
  /tabloid|celebrity|gossip/i,
  /\bcharts?\b/i
];
const KEEP = [
  /underground|indie|electronic|techno|house|trance|dubstep|d&b|drum(?:\s*&\s*| and )bass|breakbeat|ambient|idm|minimal|garage|hardgroove|leftfield/i,
  /modular|eurorack|synth|sampler|midi|vst|plugin|ableton|bitwig|fl\s*studio|max for live/i,
  /label|collective|warehouse|club|festival|lineup|mix|podcast/i
];
export function isRelevant(title:string, summary:string, source?:string) {
  const blob = `${title} ${summary} ${source||""}`;
  if (DROP.some(r=>r.test(blob))) return false;
  return KEEP.some(r=>r.test(blob));
}
