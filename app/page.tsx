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
import RDIDemoCard from '@/components/RDIDemoCard'

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

      <div className="sample-architecture-banner">
        <div className="sample-architecture-banner-content">
          <div className="sample-architecture-banner-text">
            <h2>Redis Enterprise Sample Architecture</h2>
            <p>Explore real-world architecture patterns and reference implementations</p>
          </div>
          <Link href="/sample-architecture" className="sample-architecture-button">
            View Sample Architecture →
          </Link>
        </div>
      </div>

      <div className="infrastructure-banner">
        <div className="infrastructure-banner-content">
          <div className="infrastructure-banner-text">
            <h2>Redis Metrics Dashboard</h2>
            <p>Monitor real-time Redis performance, memory usage, and cache statistics</p>
          </div>
          <Link href="/dashboard" className="infrastructure-button">
            View Dashboard →
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
        <RDIDemoCard />
      </div>
    </div>
  );
}
