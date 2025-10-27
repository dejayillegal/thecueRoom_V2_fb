
export const TAG_SYNONYMS: Record<string, string> = {
  // daw
  "ableton": "daw", "bitwig": "daw", "fl studio": "daw",
  "cubase": "daw", "logic": "daw", "reaper": "daw", "reason": "daw",
  // plugins
  "vst": "plugins", "au": "plugins", "aax": "plugins",
  "synth": "plugins", "sampler": "plugins", "sequencer": "plugins",
  "effects": "plugins", "fx": "plugins",
  // hardware
  "eurorack": "hardware", "modular": "hardware", "synthesizer": "hardware",
  // genre
  "techno": "scene", "house": "scene", "electro": "scene", "ambient": "scene",
  "idm": "scene", "jungle": "scene", "dnb": "scene", "drum and bass": "scene",
  // tutorial / how-to
  "tutorial": "tutorials", "how to": "tutorials", "guide": "tutorials",
  "masterclass": "tutorials", "workshop": "tutorials",
  // free
  "free": "freebies", "freebie": "freebies", "free download": "freebies",
  // location
  "india": "asia", "asia": "asia", "berlin": "europe", "london": "europe",
  // type
  "mix": "mixes", "podcast": "podcasts", "album": "releases", "ep": "releases",
  "track": "releases", "single": "releases", "label": "labels", "imprint": "labels",
  "event": "events", "festival": "events", "party": "events",
};

export const TAG_REGEX: Record<string, RegExp> = {
  // daw
  "daw": /\b(ableton|bitwig|fl studio|logic|cubase|reaper|reason|live|daw|digital audio workstation)\b/i,
  // plugins
  "plugins": /\b(vst|plugin|au|aax|synth|sampler|sequencer|effects|fx|instrument|reverb|delay|compressor|eq)\b/i,
  // hardware
  "hardware": /\b(eurorack|modular|synthesizer|synth|controller|midi|interface|mixer|speakers|monitors|gear)\b/i,
  // scene
  "scene": /\b(techno|house|electro|ambient|idm|jungle|dnb|drum and bass|breakbeat|dubstep|garage|minimal|trance|hardgroove|leftfield)\b/i,
  // tutorials
  "tutorials": /\b(tutorial|how to|guide|masterclass|workshop|learn|tip|trick|production|compose|mix|master)\b/i,
  // freebies
  "freebies": /\b(free|freebie|free download|giveaway)\b/i,
  // updates
  "updates": /\b(update|new version|release|beta|changelog)\b/i,
  // labels
  "labels": /\b(label|imprint|record label)\b/i,
  // events
  "events": /\b(event|festival|party|gig|live|show|tour|lineup|tickets)\b/i,
  // industry
  "industry": /\b(industry|business|music business|spotify|apple music|streaming|royalties|publishing|sync|licensing|distribution)\b/i,
  // asia
  "asia": /\b(india|asia|tokyo|delhi|mumbai|bangalore|seoul|beijing|shanghai|hong kong|singapore|bangkok|jakarta)\b/i,
  // mixes/podcasts
  "mixes": /\b(mix|dj mix|mix series)\b/i,
  "podcasts": /\b(podcast|radio show)\b/i,
  // releases
  "releases": /\b(album|ep|track|single|release|record|new music)\b/i,
};
