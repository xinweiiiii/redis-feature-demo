import CachingDemoCard from '@/components/CachingDemoCard'
import PlaceholderCard from '@/components/PlaceholderCard'
import PubSubDemoCard from '@/components/PubSubDemoCard'
import RateLimitDemoCard from '@/components/RateLimitDemoCard'
import SessionDemoCard from '@/components/SessionDemoCard'

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
        <PlaceholderCard
          title="Time Series"
          description="Track and analyze time-based data with Redis TimeSeries"
          comingSoon={true}
        />
      </div>
    </div>
  );
}
