import HomeClient, { FeedItem } from "./HomeClient";

/** Server component wrapper: fetch once → client tabs.  */
export default async function SpotlightSection({ items }: { items: FeedItem[] }) {
  return (
    <section aria-label="Feeds">
      <HomeClient initialItems={items} />
    </section>
  );
}
