"use client";
import NextImage, { ImageProps as NextImageProps } from "next/image";
type Props = Omit<NextImageProps, "loader"> & { src: string };
const ALLOW = new Set([
  "cdm.link","musictech.com","www.kvraudio.com","bedroomproducersblog.com","www.musicradar.com",
  "blog.native-instruments.com","blog.arturia.com","www.elektron.se","novationmusic.com","splice.com",
  "ra.co","mixmag.net","djmag.com","static.djmag.com","www.factmag.com","xlr8r.com",
  "daily.bandcamp.com","theplayground.co.uk","earmilk.com","www.stereofox.com","neonmusic.co.uk","thissongissick.com",
  "ufo-network.com","www.youredm.com","edm.com","www.edmsauce.com",
  "consequence.net","www.allmusic.com","www.spin.com","www.complex.com","www.thefader.com",
  "www.popjustice.com","www.undertheradarmag.com","hypem.com",
  "www.musicbusinessworldwide.com","www.hypebot.com","music3point0.com","www.theunsignedguide.com",
  "i0.wp.com","i1.wp.com","i2.wp.com","images.ctfassets.net","preview.redd.it","i.redd.it","external-preview.redd.it",
  "rollingstoneindia.com","highonscore.com","www.musicplus.in","theindianmusicdiaries.com","www.bordermovement.com","clubberia.com"
]);
const WP_RE = /(^|\.)wp\.com$/i;
const ok = (h:string)=> ALLOW.has(h) || WP_RE.test(h);
export default function SmartImage({ src, alt, className, fill, sizes, priority, fetchPriority, ...rest }: Props) {
  let host = ""; try { host = new URL(src).hostname.toLowerCase(); } catch {}
  if (ok(host)) {
    return <NextImage src={src} alt={alt} className={className} fill={fill} sizes={sizes}
                      priority={priority} fetchPriority={fetchPriority} {...rest} />;
  }
  if (fill) {
    return <img src={src} alt={alt} sizes={sizes} className={["absolute inset-0 w-full h-full object-cover", className||""].join(" ")} loading={priority?"eager":"lazy"} />;
  }
  return <img src={src} alt={alt} className={className} loading={priority?"eager":"lazy"} />;
}
