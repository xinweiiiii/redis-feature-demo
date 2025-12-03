import CachingDemoCard from '@/components/CachingDemoCard'
import PubSubDemoCard from '@/components/PubSubDemoCard'
import RateLimitDemoCard from '@/components/RateLimitDemoCard'
import SessionDemoCard from '@/components/SessionDemoCard'
import TimeSeriesDemoCard from '@/components/TimeSeriesDemoCard'
import SearchDemoCard from '@/components/SearchDemoCard'
import PlaceholderCard from '@/components/PlaceholderCard'

export default function Home() {
  return (
    <div className="container">
      <h1>Redis Feature Demos</h1>
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
        <PlaceholderCard
          title="Redis Streams"
          description="Build real-time event streams with Redis Streams for message queuing, event sourcing, and log aggregation"
          comingSoon={true}
        />
      </div>
    </div>
  );
}
