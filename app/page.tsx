import CachingDemoCard from '@/components/CachingDemoCard'
import PlaceholderCard from '@/components/PlaceholderCard'

export default function Home() {
  return (
    <div className="container">
      <h1>Redis Feature Demos</h1>
      <p style={{ color: '#666', marginBottom: '1rem' }}>
        Explore different Redis features with interactive demonstrations
      </p>

      <div className="cards-grid">
        <CachingDemoCard />
        <PlaceholderCard
          title="Pub/Sub Messaging"
          description="Real-time message publishing and subscription with Redis Pub/Sub"
          comingSoon
        />
        <PlaceholderCard
          title="Rate Limiting"
          description="Implement rate limiting with Redis to control API usage"
          comingSoon
        />
        <PlaceholderCard
          title="Session Management"
          description="Store and manage user sessions with Redis"
          comingSoon
        />
      </div>
    </div>
  )
}
