import CachingDemoCard from '@/components/CachingDemoCard'
import PubSubDemoCard from '@/components/PubSubDemoCard'
import RateLimitDemoCard from '@/components/RateLimitDemoCard'
import SessionDemoCard from '@/components/SessionDemoCard'
import TimeSeriesDemoCard from '@/components/TimeSeriesDemoCard'
import SearchDemoCard from '@/components/SearchDemoCard'
import StreamDemoCard from '@/components/StreamDemoCard'
import LeaderboardDemoCard from '@/components/LeaderboardDemoCard'
import SemanticCacheDemoCard from '@/components/SemanticCacheDemoCard'
import FeatureStoreDemoCard from '@/components/FeatureStoreDemoCard'
import PlaceholderCard from '@/components/PlaceholderCard'

export default function Home() {
  return (
    <div className="container">
      <p style={{ color: "#666", marginBottom: "1rem" }}>
        Explore different Redis features with interactive demonstrations
      </p>

      <div className="cards-grid">
        <CachingDemoCard />
        <PubSubDemoCard />
        <RateLimitDemoCard />
        <SessionDemoCard />
        <TimeSeriesDemoCard />
        <SearchDemoCard />
        <StreamDemoCard />
        <LeaderboardDemoCard />
        <SemanticCacheDemoCard />
        <FeatureStoreDemoCard />
        <PlaceholderCard
          title="Redis Data Integration (RDI)"
          description="Sync data from various sources to Redis in real-time"
          comingSoon={true}
        />
      </div>
    </div>
  );
}
