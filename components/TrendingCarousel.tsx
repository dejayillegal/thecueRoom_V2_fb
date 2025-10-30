import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const NewsFeedContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background-color: #f4f7f6;
  min-height: 100vh;
`;

const SpotlightSection = styled.section`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  position: relative;
`;

const SpotlightTitle = styled.h2`
  font-size: 2rem;
  color: #333;
  margin-bottom: 20px;
  font-weight: 700;
`;

const SpotlightCarousel = styled.div`
  display: flex;
  gap: 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 15px; /* Space for scrollbar if needed, though we aim for auto-scroll */
  scrollbar-width: none; /* Hide scrollbar for Firefox */
  -ms-overflow-style: none; /* Hide scrollbar for IE and Edge */

  &::-webkit-scrollbar {
    display: none; /* Hide scrollbar for Chrome, Safari, and Opera */
  }
`;

const SpotlightCard = styled(motion.div)`
  flex: 0 0 60%; /* Adjust this to control card width */
  scroll-snap-align: start;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background-size: cover;
  background-position: center;
  min-height: 400px; /* Ensure cards have height */
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 15px rgba(0,0,0,0.15);
  }

  @media (max-width: 768px) {
    flex: 0 0 80%;
  }
  @media (max-width: 480px) {
    flex: 0 0 95%;
  }
`;

const SpotlightCardOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8) 20%, rgba(0,0,0,0) 60%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 20px;
  color: white;
`;

const SpotlightCardTitle = styled.h3`
  font-size: 1.8rem;
  margin-bottom: 10px;
  font-weight: 700;
  line-height: 1.3;
`;

const SpotlightCardSummary = styled.p`
  font-size: 0.95rem; /* Slightly reduced font size */
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 15px;
  line-height: 1.5;
  max-height: 60px; /* Limit summary height */
  overflow: hidden;
`;

const SpotlightCardMeta = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto; /* Push to bottom */
`;

const TrendingSection = styled.section`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
`;

const TrendingTitle = styled.h2`
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 20px;
  font-weight: 700;
`;

const TrendingCarousel = styled.div`
  display: flex;
  gap: 15px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 15px;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const TrendingCard = styled(motion.div)`
  flex: 0 0 300px; /* Fixed width for trending cards */
  scroll-snap-align: start;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column; /* Stack elements vertically */
  background-color: #f9f9f9;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  height: 150px; /* Fixed height */

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  }

  @media (max-width: 768px) {
    flex: 0 0 250px;
  }
  @media (max-width: 480px) {
    flex: 0 0 80%;
  }
`;

const TrendingCardImage = styled.div`
  width: 100%;
  height: 100px; /* Height of the thumbnail */
  background-size: cover;
  background-position: center;
  border-radius: 8px 8px 0 0; /* Rounded top corners */
  flex-shrink: 0; /* Prevent image from shrinking */
`;

const TrendingCardContent = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-grow: 1; /* Allow content to take remaining space */
`;

const TrendingCardTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Limit title to 2 lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TrendingCardMeta = styled.div`
  font-size: 0.75rem;
  color: #777;
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 15px;
`;

const Tag = styled.button`
  background-color: #e0e0e0;
  color: #555;
  border: none;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease;
  white-space: nowrap; /* Prevent tags from breaking */

  &:hover {
    background-color: #ccc;
    color: #333;
  }
  &.active {
    background-color: #007bff;
    color: white;
    font-weight: bold;
  }
`;

const ALL_TAGS_KEY = '__all__';

function NewsFeed() {
  const [news, setNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [activeTag, setActiveTag] = useState(ALL_TAGS_KEY);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [trendingIndex, setTrendingIndex] = useState(0);

  const spotlightScrollRef = useRef(null);
  const trendingScrollRef = useRef(null);

  const [isSpotlightAutoScrolling, setIsSpotlightAutoScrolling] = useState(true);
  const [isSpotlightPaused, setIsSpotlightPaused] = useState(false);
  const spotlightRafRef = useRef(null);

  const [isTrendingAutoScrolling, setIsTrendingAutoScrolling] = useState(true);
  const [isTrendingPaused, setIsTrendingPaused] = useState(false);
  const trendingRafRef = useRef(null);

  // Mock API call
  useEffect(() => {
    const mockNews = [
      { id: 1, title: "Global Markets Rally on Positive Economic Data", summary: "Stock markets worldwide saw significant gains following the release of stronger-than-expected inflation reports and employment figures.", source: "Financial Times", date: "2023-10-27", tags: ["finance", "markets", "economy"], thumbnailUrl: "https://via.placeholder.com/600x400/FFDDC1/000000?text=Markets+Rally" },
      { id: 2, title: "Breakthrough in Renewable Energy Technology", summary: "Scientists have announced a new solar panel efficiency record, potentially revolutionizing the renewable energy sector.", source: "Science Today", date: "2023-10-26", tags: ["technology", "energy", "science"], thumbnailUrl: "https://via.placeholder.com/600x400/C1FFD7/000000?text=Renewable+Energy" },
      { id: 3, title: "New Study Links Gut Health to Mental Well-being", summary: "Researchers have found a strong correlation between the gut microbiome and mental health conditions like anxiety and depression.", source: "Health Journal", date: "2023-10-25", tags: ["health", "science", "mental health"], thumbnailUrl: "https://via.placeholder.com/600x400/D1C1FF/000000?text=Gut+Health" },
      { id: 4, title: "Space Exploration Milestone: First Asteroid Sample Returned", summary: "NASA successfully retrieved samples from an asteroid, providing crucial insights into the early solar system.", source: "Space Chronicle", date: "2023-10-24", tags: ["space", "science", "exploration"], thumbnailUrl: "https://via.placeholder.com/600x400/ADD8E6/000000?text=Asteroid+Sample" },
      { id: 5, title: "AI Ethics Debate Intensifies at Global Summit", summary: "Leaders and experts are discussing the ethical implications of artificial intelligence, focusing on bias, transparency, and accountability.", source: "Tech Insights", date: "2023-10-23", tags: ["technology", "AI", "ethics"], thumbnailUrl: "https://via.placeholder.com/600x400/FFB6C1/000000?text=AI+Ethics" },
      { id: 6, title: "Cultural Festival Celebrates Diversity and Arts", summary: "The annual city festival brought together artists and communities from around the world, showcasing a vibrant display of culture.", source: "Local News", date: "2023-10-22", tags: ["culture", "arts", "community"], thumbnailUrl: "https://via.placeholder.com/600x400/F0E68C/000000?text=Cultural+Festival" },
      { id: 7, title: "Advances in Quantum Computing Poised to Reshape Industries", summary: "New developments in quantum computing could lead to breakthroughs in fields ranging from medicine to materials science.", source: "Future Tech", date: "2023-10-21", tags: ["technology", "quantum computing", "innovation"], thumbnailUrl: "https://via.placeholder.com/600x400/98FB98/000000?text=Quantum+Computing" },
      { id: 8, title: "Climate Change Summit Yields New Pledges for Emission Reduction", summary: "World leaders have committed to more aggressive targets for reducing greenhouse gas emissions following intense negotiations.", source: "Global Environment", date: "2023-10-20", tags: ["environment", "climate change", "politics"], thumbnailUrl: "https://via.placeholder.com/600x400/AFEEEE/000000?text=Climate+Summit" },
      { id: 9, title: "The Rise of Remote Work: Trends and Challenges", summary: "A look at the evolving landscape of remote work, exploring its benefits, drawbacks, and future outlook for businesses and employees.", source: "Business Review", date: "2023-10-19", tags: ["business", "work", "trends"], thumbnailUrl: "https://via.placeholder.com/600x400/FFA07A/000000?text=Remote+Work" },
      { id: 10, title: "Archaeological Discovery Sheds Light on Ancient Civilization", summary: "Excavations have uncovered artifacts that provide new insights into the daily life and societal structure of a previously little-known ancient culture.", source: "History Today", date: "2023-10-18", tags: ["history", "archaeology", "culture"], thumbnailUrl: "https://via.placeholder.com/600x400/DDA0DD/000000?text=Archaeology" },
    ];
    setNews(mockNews);
    setFilteredNews(mockNews);
  }, []);

  // Tag filtering logic
  const handleTagClick = useCallback((tag) => {
    setActiveTag(tag);
    if (tag === ALL_TAGS_KEY) {
      setFilteredNews(news);
    } else {
      setFilteredNews(news.filter(item => item.tags.includes(tag)));
    }
  }, [news]);

  // Spotlight Auto Scroll
  const spotlightAutoScroll = useCallback(() => {
    if (!spotlightScrollRef.current || !isSpotlightAutoScrolling || isSpotlightPaused) return;

    const container = spotlightScrollRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;

    if (scrollLeft >= scrollWidth - clientWidth - 10) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
      setTimeout(() => {
        spotlightRafRef.current = requestAnimationFrame(spotlightAutoScroll);
      }, 2000); // Pause for 2 seconds before restarting scroll
    } else {
      container.scrollLeft += 0.5; // Slower scroll speed
      spotlightRafRef.current = requestAnimationFrame(spotlightAutoScroll);
    }
  }, [isSpotlightAutoScrolling, isSpotlightPaused]);

  useEffect(() => {
    if (isSpotlightAutoScrolling && !isSpotlightPaused) {
      spotlightRafRef.current = requestAnimationFrame(spotlightAutoScroll);
    } else {
      cancelAnimationFrame(spotlightRafRef.current);
    }
    return () => cancelAnimationFrame(spotlightRafRef.current);
  }, [isSpotlightAutoScrolling, isSpotlightPaused, spotlightAutoScroll]);

  // Trending Auto Scroll
  const autoScroll = useCallback(() => {
    if (!trendingScrollRef.current || !isTrendingAutoScrolling || isTrendingPaused) return;

    const container = trendingScrollRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;

    if (scrollLeft >= scrollWidth - clientWidth - 10) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
      setTimeout(() => {
        trendingRafRef.current = requestAnimationFrame(autoScroll);
      }, 2000); // Pause for 2 seconds before restarting scroll
    } else {
      container.scrollLeft += 0.5; // Slower scroll speed
      trendingRafRef.current = requestAnimationFrame(autoScroll);
    }
  }, [isTrendingAutoScrolling, isTrendingPaused]);

  useEffect(() => {
    if (isTrendingAutoScrolling && !isTrendingPaused) {
      trendingRafRef.current = requestAnimationFrame(autoScroll);
    } else {
      cancelAnimationFrame(trendingRafRef.current);
    }
    return () => cancelAnimationFrame(trendingRafRef.current);
  }, [isTrendingAutoScrolling, isTrendingPaused, autoScroll]);


  // Extract all unique tags for the filter
  const allTags = news.reduce((acc, item) => {
    item.tags.forEach(tag => {
      if (!acc.includes(tag)) {
        acc.push(tag);
      }
    });
    return acc;
  }, []);

  const handleMouseEnter = (section) => {
    if (section === 'spotlight') setIsSpotlightPaused(true);
    if (section === 'trending') setIsTrendingPaused(true);
  };

  const handleMouseLeave = (section) => {
    if (section === 'spotlight') setIsSpotlightPaused(false);
    if (section === 'trending') setIsTrendingPaused(false);
  };

  return (
    <NewsFeedContainer>
      <SpotlightSection
        onMouseEnter={() => handleMouseEnter('spotlight')}
        onMouseLeave={() => handleMouseLeave('spotlight')}
      >
        <SpotlightTitle>Featured News</SpotlightTitle>
        <SpotlightCarousel ref={spotlightScrollRef}>
          {news.map((item, index) => (
            <SpotlightCard
              key={item.id}
              style={{ backgroundImage: `url(${item.thumbnailUrl})` }}
              // initial={{ opacity: 0, x: 50 }}
              // animate={{ opacity: 1, x: 0 }}
              // exit={{ opacity: 0, x: -50 }}
              // transition={{ duration: 0.5 }}
              onClick={() => window.open(item.url || '#', '_blank')} // Assuming an 'url' property exists
            >
              <SpotlightCardOverlay>
                <SpotlightCardTitle>{item.title}</SpotlightCardTitle>
                <SpotlightCardSummary>{item.summary}</SpotlightCardSummary>
                <SpotlightCardMeta>
                  <span>{item.source}</span>
                  <span>{new Date(item.date).toLocaleDateString()}</span>
                </SpotlightCardMeta>
              </SpotlightCardOverlay>
            </SpotlightCard>
          ))}
        </SpotlightCarousel>
      </SpotlightSection>

      <TrendingSection
        onMouseEnter={() => handleMouseEnter('trending')}
        onMouseLeave={() => handleMouseLeave('trending')}
      >
        <TrendingTitle>Trending Now</TrendingTitle>
        <TrendingCarousel ref={trendingScrollRef}>
          {filteredNews.map((item) => (
            <TrendingCard key={item.id} onClick={() => window.open(item.url || '#', '_blank')}>
              <TrendingCardImage style={{ backgroundImage: `url(${item.thumbnailUrl})` }} />
              <TrendingCardContent>
                <TrendingCardTitle>{item.title}</TrendingCardTitle>
                <TrendingCardMeta>
                  <span>{item.source}</span>
                  <span>{new Date(item.date).toLocaleDateString()}</span>
                </TrendingCardMeta>
              </TrendingCardContent>
            </TrendingCard>
          ))}
        </TrendingCarousel>
      </TrendingSection>

      <TagsContainer>
        <Tag
          className={activeTag === ALL_TAGS_KEY ? 'active' : ''}
          onClick={() => handleTagClick(ALL_TAGS_KEY)}
        >
          All
        </Tag>
        {allTags.map((tag) => (
          <Tag
            key={tag}
            className={activeTag === tag ? 'active' : ''}
            onClick={() => handleTagClick(tag)}
          >
            {tag.charAt(0).toUpperCase() + tag.slice(1)}
          </Tag>
        ))}
      </TagsContainer>
    </NewsFeedContainer>
  );
}

export default NewsFeed;