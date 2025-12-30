import Link from 'next/link'
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
import ProbabilisticDemoCard from '@/components/ProbabilisticDemoCard'
import PlaceholderCard from '@/components/PlaceholderCard'

export default function Home() {
  return (
    <div className="container">
      <div className="infrastructure-banner">
        <div className="infrastructure-banner-content">
          <div className="infrastructure-banner-text">
            <h2>Redis Enterprise Infrastructure</h2>
            <p>Learn about clustering, high availability, geo-distribution, and enterprise capabilities</p>
          </div>
          <Link href="/infrastructure" className="infrastructure-button">
            View Infrastructure Guide →
          </Link>
        </div>
      </div>

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
        <ProbabilisticDemoCard />
        <PlaceholderCard
          title="Redis Data Integration (RDI)"
          description="Sync data from various sources to Redis in real-time"
          comingSoon={true}
        />
      </div>
    </div>
  );
}
