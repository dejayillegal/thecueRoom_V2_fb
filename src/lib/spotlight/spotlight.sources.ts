export type Source =
  | { name:string; url:string; tags:string[]; maxItems?:number; kind:"rss" }
  | { name:string; url:string; tags:string[]; maxItems?:number; kind:"scrape";
      list:string; title:string; link:string; image?:string; summary?:string; date?:string };

export const SPOTLIGHT_SOURCES: Source[] = [
  // Scene / Underground
  { name:"6AM Group", kind:"rss", url:"https://www.6amgroup.com/feed/", tags:["scene","asia"] },
  { name:"The Playground", kind:"rss", url:"https://theplayground.co.uk/blog/feed/", tags:["scene"] },
  { name:"Earmilk", kind:"rss", url:"https://earmilk.com/feed/", tags:["scene"] },
  { name:"XLR8R", kind:"rss", url:"https://xlr8r.com/feed/", tags:["scene","mixes"] },
  { name:"FACT", kind:"rss", url:"https://www.factmag.com/feed/", tags:["news","features"] },
  { name:"Bandcamp Daily", kind:"rss", url:"https://daily.bandcamp.com/feed", tags:["features","reviews"] },
  { name:"Ransom Note", kind:"rss", url:"https://www.theransomnote.com/feed/", tags:["culture","scene"] },
  { name:"Stereofox", kind:"rss", url:"https://www.stereofox.com/feed/", tags:["discover"] },
  { name:"Neon Music", kind:"rss", url:"https://neonmusic.co.uk/feed/", tags:["discover"] },
  { name:"This Song Is Sick", kind:"rss", url:"https://thissongissick.com/feed/", tags:["discover"] },
  { name:"UFO Network", kind:"rss", url:"https://ufo-network.com/feed/", tags:["edm","scene"] },
  { name:"Your EDM", kind:"rss", url:"https://www.youredm.com/feed/", tags:["edm","scene"] },
  { name:"EDM.com", kind:"rss", url:"https://edm.com/.rss/full/", tags:["edm"] },
  { name:"EDM Sauce", kind:"rss", url:"https://www.edmsauce.com/feed/", tags:["edm"] },
  { name:"Under The Radar", kind:"rss", url:"https://www.undertheradarmag.com/site/rss", tags:["indie"] },
  { name:"Popjustice", kind:"rss", url:"https://www.popjustice.com/feed/", tags:["pop","alt"] },
  { name:"The FADER — Music", kind:"rss", url:"https://www.thefader.com/feeds/music.rss", tags:["alt","scene"] },
  { name:"Complex — Music", kind:"rss", url:"https://www.complex.com/music/rss", tags:["alt"] },
  { name:"SPIN", kind:"rss", url:"https://www.spin.com/feed/", tags:["alt"] },
  { name:"AllMusic Blog", kind:"rss", url:"https://www.allmusic.com/blog/rss", tags:["culture"] },

  // Industry
  { name:"Music Business Worldwide", kind:"rss", url:"https://www.musicbusinessworldwide.com/feed/", tags:["industry"] },
  { name:"Hypebot", kind:"rss", url:"https://www.hypebot.com/feed", tags:["industry"] },
  { name:"Music 3.0", kind:"rss", url:"https://music3point0.com/feed/", tags:["industry","howto"] },
  { name:"Unsigned Guide — News", kind:"rss", url:"https://www.theunsignedguide.com/news/rss", tags:["industry"] },

  // Gear / Production / DAWs / Plugins
  { name:"CDM — Create Digital Music", kind:"rss", url:"https://cdm.link/feed/", tags:["gear","production"] },
  { name:"MusicTech", kind:"rss", url:"https://musictech.com/feed/", tags:["gear","production"] },
  { name:"KVR Audio — News", kind:"rss", url:"https://www.kvraudio.com/news.rss", tags:["plugins","updates","kvr"] },
  { name:"Bedroom Producers Blog", kind:"rss", url:"https://bedroomproducersblog.com/feed/", tags:["plugins","freebies"] },
  { name:"MusicRadar — News", kind:"rss", url:"https://www.musicradar.com/rss/news", tags:["gear"] },
  { name:"Ableton Blog", kind:"rss", url:"https://www.ableton.com/en/blog/feed/", tags:["daw","ableton","tutorials"] },
  { name:"Bitwig", kind:"rss", url:"https://www.bitwig.com/news/feed/", tags:["daw","bitwig"] },
  { name:"Image-Line (FL Studio)", kind:"rss", url:"https://www.image-line.com/feed/", tags:["daw","flstudio"] },
  { name:"Native Instruments", kind:"rss", url:"https://blog.native-instruments.com/feed/", tags:["plugins","hardware"] },
  { name:"Arturia", kind:"rss", url:"https://blog.arturia.com/feed/", tags:["plugins","hardware"] },
  { name:"Elektron", kind:"rss", url:"https://www.elektron.se/news/feed/", tags:["hardware"] },
  { name:"Novation", kind:"rss", url:"https://novationmusic.com/en/news/feed", tags:["hardware"] },

  // Asia / India
  { name:"Rolling Stone India", kind:"rss", url:"https://rollingstoneindia.com/feed/", tags:["india","scene"] },
  { name:"HighOnScore", kind:"rss", url:"https://highonscore.com/feed/", tags:["india","reviews"] },
  { name:"Music Plus India", kind:"rss", url:"https://www.musicplus.in/feed/", tags:["india","industry"] },
  { name:"The Indian Music Diaries", kind:"rss", url:"https://theindianmusicdiaries.com/feed/", tags:["india","indie"] },
  { name:"Border Movement", kind:"rss", url:"https://www.bordermovement.com/feed/", tags:["asia","features"] },
  { name:"Clubberia (JP)", kind:"rss", url:"https://clubberia.com/ja/news/rss/", tags:["asia","clubs"] },

  // SCRAPE fallbacks (metadata only)
  { name:"Consequence — Music", kind:"scrape",
    url:"https://consequence.net/music/",
    tags:["alt","scene"],
    list:"article.card", title:"h2 a", link:"h2 a", image:"img", summary:".entry-excerpt", date:"time" },
  { name:"Hype Machine — Popular", kind:"scrape",
    url:"https://hypem.com/popular",
    tags:["discover"],
    list:"div.popular div.section-track", title:"a.track_name", link:"a.track_name", image:"img", summary:".section-track .meta" }
];
