import CachingDemoCard from '@/components/CachingDemoCard'
import PubSubDemoCard from '@/components/PubSubDemoCard'
import RateLimitDemoCard from '@/components/RateLimitDemoCard'
import SessionDemoCard from '@/components/SessionDemoCard'
import TimeSeriesDemoCard from '@/components/TimeSeriesDemoCard'

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
      </div>
    </div>
  );
}
