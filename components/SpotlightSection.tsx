import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const NewsFeedContainer = styled.div`
  width: 100%;
  padding: 20px 0;
  background-color: #f4f4f9;
`;

const SectionTitle = styled.h2`
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
  padding: 0 20px;
`;

const SpotlightCarousel = styled.div`
  width: 100%;
  overflow: hidden;
  position: relative;
  padding: 20px 0;
`;

const SpotlightItems = styled.div`
  display: flex;
  transition: transform 0.5s ease-in-out;
`;

const SpotlightItem = styled(motion.div)`
  flex: 0 0 auto;
  width: 70%; /* Adjust width as needed */
  margin-right: 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;

  &:last-child {
    margin-right: 20px; /* Keep margin for the last item */
  }
`;

const SpotlightImage = styled.img`
  width: 100%;
  height: 300px; /* Fixed height for consistency */
  object-fit: cover;
  border-radius: 12px 12px 0 0; /* Sharp top corners */
`;

const SpotlightContent = styled.div`
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-grow: 1;
`;

const SpotlightTitle = styled.h3`
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SpotlightSummary = styled.p`
  font-size: 14px; /* Reduced font size */
  color: #666;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SpotlightMeta = styled.div`
  font-size: 12px;
  color: #999;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
`;

const TrendingCarousel = styled.div`
  width: 100%;
  overflow-x: auto;
  white-space: nowrap;
  padding: 15px 0;
  scrollbar-width: none; /* Hide scrollbar for Firefox */
  -ms-overflow-style: none; /* Hide scrollbar for IE and Edge */

  &::-webkit-scrollbar {
    display: none; /* Hide scrollbar for Chrome, Safari and Opera */
  }
`;

const TrendingItem = styled.div`
  display: inline-block;
  margin-right: 15px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  width: 250px; /* Fixed width for trending items */
  vertical-align: top;
  white-space: normal; /* Allow text to wrap within the item */
  display: flex;
  flex-direction: column;
`;

const TrendingImage = styled.img`
  width: 100%;
  height: 150px; /* Fixed height */
  object-fit: cover;
  border-radius: 8px 8px 0 0;
`;

const TrendingContent = styled.div`
  padding: 10px;
  display: flex;
  flex-direction: column;
`;

const TrendingTitle = styled.h4`
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TrendingMeta = styled.div`
  font-size: 11px;
  color: #999;
  margin-top: auto; /* Pushes meta to the bottom */
`;

const FilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0 20px 20px 20px;
  margin-bottom: 20px;
`;

const FilterButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 20px;
  background-color: ${(props) => (props.active ? '#007bff' : 'white')};
  color: ${(props) => (props.active ? 'white' : '#333')};
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s, color 0.3s;

  &:hover {
    background-color: ${(props) => (props.active ? '#0056b3' : '#eee')};
  }
`;

const FilterTag = styled.span`
  background-color: #e0e0e0;
  color: #555;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 13px;
  margin-right: 5px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #ccc;
  }
`;

const NewsFeed = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const scrollRef = useRef(null);
  const rafRef = useRef(null);
  const spotlightRef = useRef(null);
  const articleRefs = useRef([]);

  // Fetch articles
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      try {
        // Simulating fetch with a delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        const response = [
          { id: 1, title: "Global Tech Summit Kicks Off", summary: "The annual Global Tech Summit has begun, featuring keynotes from industry leaders and discussions on AI, blockchain, and quantum computing.", source: "TechTimes", date: "2023-10-27", tags: ["technology", "business", "AI"], thumbnailUrl: "https://via.placeholder.com/300x200/0000FF/FFFFFF?text=Tech+Summit" },
          { id: 2, title: "New Breakthrough in Renewable Energy", summary: "Scientists have announced a significant advancement in solar panel efficiency, potentially revolutionizing the renewable energy sector.", source: "EcoNews", date: "2023-10-26", tags: ["environment", "energy", "science"], thumbnailUrl: "https://via.placeholder.com/300x200/2ECC71/FFFFFF?text=Renewable+Energy" },
          { id: 3, title: "Stock Market Sees Volatile Trading", summary: "Markets experienced significant fluctuations today as investors reacted to economic indicators and geopolitical events.", source: "FinanceDaily", date: "2023-10-27", tags: ["finance", "business", "economy"], thumbnailUrl: "https://via.placeholder.com/300x200/FF8C00/FFFFFF?text=Stock+Market" },
          { id: 4, title: "Cultural Festival Celebrates Diversity", summary: "The city's annual cultural festival is underway, showcasing vibrant traditions, music, and cuisine from around the world.", source: "LocalHerald", date: "2023-10-26", tags: ["culture", "community", "events"], thumbnailUrl: "https://via.placeholder.com/300x200/9370DB/FFFFFF?text=Cultural+Festival" },
          { id: 5, title: "Space Exploration Milestone Reached", summary: "A new unmanned mission has successfully reached its target destination in deep space, paving the way for future exploration.", source: "SpaceToday", date: "2023-10-25", tags: ["space", "science", "exploration"], thumbnailUrl: "https://via.placeholder.com/300x200/FF69B4/FFFFFF?text=Space+Exploration" },
          { id: 6, title: "New Health Guidelines Issued", summary: "Health authorities have updated guidelines for the upcoming flu season, emphasizing vaccination and preventative measures.", source: "HealthWatch", date: "2023-10-27", tags: ["health", "medicine", "wellness"], thumbnailUrl: "https://via.placeholder.com/300x200/DA70D6/FFFFFF?text=Health+Guidelines" },
          { id: 7, title: "AI Ethics Debate Intensifies", summary: "Discussions surrounding the ethical implications of artificial intelligence are becoming more prominent in academic and public spheres.", source: "AI Journal", date: "2023-10-26", tags: ["technology", "AI", "ethics"], thumbnailUrl: "https://via.placeholder.com/300x200/4682B4/FFFFFF?text=AI+Ethics" },
          { id: 8, title: "Urban Development Project Approved", summary: "A major urban development project aimed at revitalizing the downtown area has received official approval.", source: "CityNews", date: "2023-10-25", tags: ["business", "community", "urban"], thumbnailUrl: "https://via.placeholder.com/300x200/32CD32/FFFFFF?text=Urban+Development" }
        ];
        setArticles(response);
      } catch (err) {
        setError("Failed to fetch news. Please try again later.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  // Filtered articles
  const filteredArticles = articles.filter(article =>
    activeFilter === 'all' || article.tags.includes(activeFilter)
  );

  // Spotlight auto-scroll
  const autoScroll = useCallback(() => {
    if (!scrollRef.current || !isAutoScrolling || isPaused) return;

    const container = scrollRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;

    if (scrollLeft >= scrollWidth - clientWidth - 10) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
      setTimeout(() => {
        rafRef.current = requestAnimationFrame(autoScroll);
      }, 2000);
    } else {
      container.scrollLeft += 0.5;
      rafRef.current = requestAnimationFrame(autoScroll);
    }
  }, [isAutoScrolling, isPaused]);


  useEffect(() => {
    if (isAutoScrolling && !isPaused) {
      rafRef.current = requestAnimationFrame(autoScroll);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isAutoScrolling, isPaused, autoScroll]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  // Spotlight item click
  const handleSpotlightClick = useCallback((index) => {
    setActiveFilter(articles[index]?.tags[0] || 'all'); // Set filter to the first tag of clicked article
    // Optionally, you could navigate to a detail page here
  }, [articles]);

  const handleFilterClick = (tag) => {
    setActiveFilter(tag);
    // Reset spotlight index or scroll to the clicked item's corresponding trending item if desired
  };

  // Sync spotlight scroll with trending items (simplified for demonstration)
  useEffect(() => {
    const currentScrollLeft = scrollRef.current?.scrollLeft || 0;
    const containerWidth = scrollRef.current?.clientWidth || 1;
    const scrollPercentage = currentScrollLeft / (scrollRef.current?.scrollWidth - containerWidth);

    if (spotlightRef.current) {
      const spotlightItems = spotlightRef.current.children;
      if (spotlightItems.length > 0) {
        const newIndex = Math.min(
          Math.floor(scrollPercentage * spotlightItems.length),
          spotlightItems.length - 1
        );
        setSpotlightIndex(newIndex);
      }
    }
  }, [articles, spotlightIndex]); // Re-run when articles or index changes

  return (
    <NewsFeedContainer>
      <SectionTitle>Spotlight</SectionTitle>
      <SpotlightCarousel
        ref={scrollRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <SpotlightItems
          style={{
            transform: `translateX(-${spotlightIndex * (100 / filteredArticles.length)}%)`
          }}
          ref={spotlightRef}
        >
          {filteredArticles.map((article, index) => (
            <SpotlightItem
              key={article.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              style={{ width: `${100 / filteredArticles.length}%` }} // Distribute width evenly
              onClick={() => handleSpotlightClick(index)}
            >
              <SpotlightImage src={article.thumbnailUrl} alt={article.title} />
              <SpotlightContent>
                <SpotlightTitle>{article.title}</SpotlightTitle>
                <SpotlightSummary>{article.summary}</SpotlightSummary>
                <SpotlightMeta>
                  <span>{article.source}</span>
                  <span>{article.date}</span>
                  <div>
                    {article.tags.map((tag) => (
                      <FilterTag key={tag} onClick={(e) => { e.stopPropagation(); handleFilterClick(tag); }}>{tag}</FilterTag>
                    ))}
                  </div>
                </SpotlightMeta>
              </SpotlightContent>
            </SpotlightItem>
          ))}
        </SpotlightItems>
      </SpotlightCarousel>

      <SectionTitle>Trending News</SectionTitle>
      <FilterContainer>
        <FilterButton active={activeFilter === 'all'} onClick={() => handleFilterClick('all')}>All</FilterButton>
        {/* Dynamically generate tags from articles */}
        {Array.from(new Set(articles.flatMap(a => a.tags))).map(tag => (
          <FilterButton key={tag} active={activeFilter === tag} onClick={() => handleFilterClick(tag)}>
            {tag.charAt(0).toUpperCase() + tag.slice(1)}
          </FilterButton>
        ))}
      </FilterContainer>
      <TrendingCarousel>
        {loading && <p style={{ padding: '0 20px' }}>Loading trending news...</p>}
        {error && <p style={{ padding: '0 20px', color: 'red' }}>{error}</p>}
        {!loading && !error && filteredArticles.map((article, index) => (
          <TrendingItem key={article.id} ref={el => articleRefs.current[index] = el}>
            <TrendingImage src={article.thumbnailUrl} alt={article.title} />
            <TrendingContent>
              <TrendingTitle>{article.title}</TrendingTitle>
              <TrendingMeta>
                <span>{article.source}</span> - <span>{article.date}</span>
              </TrendingMeta>
            </TrendingContent>
          </TrendingItem>
        ))}
      </TrendingCarousel>
    </NewsFeedContainer>
  );
};

export default NewsFeed;