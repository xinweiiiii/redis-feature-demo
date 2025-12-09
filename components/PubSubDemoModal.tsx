'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface Message {
  channel: string;
  message: string;
  timestamp: string;
  id: string;
}

interface NetworkNode {
  id: string;
  type: 'publisher' | 'channel' | 'subscriber';
  label: string;
}

interface NetworkLink {
  source: string;
  target: string;
  type: 'publish' | 'subscribe';
}

interface PubSubDemoModalProps {
  onClose: () => void;
}

export default function PubSubDemoModal({ onClose }: PubSubDemoModalProps) {
  const [channel, setChannel] = useState('notifications');
  const [publishMessage, setPublishMessage] = useState('Hello from Redis Pub/Sub!');
  const [subscribeChannels, setSubscribeChannels] = useState('notifications,updates');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastCommand, setLastCommand] = useState('');
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Network graph data
  const [publishedChannels, setPublishedChannels] = useState<Set<string>>(new Set());
  const [activeSubscriptions, setActiveSubscriptions] = useState<Set<string>>(new Set());

  // Build network graph data
  const networkData = useMemo(() => {
    const nodes: NetworkNode[] = [];
    const links: NetworkLink[] = [];

    // Publisher node
    nodes.push({ id: 'publisher', type: 'publisher', label: 'Publisher' });

    // Subscriber node
    nodes.push({ id: 'subscriber', type: 'subscriber', label: 'Subscriber' });

    // Channel nodes
    const allChannels = new Set([...publishedChannels, ...activeSubscriptions]);
    allChannels.forEach(ch => {
      nodes.push({ id: `channel_${ch}`, type: 'channel', label: ch });
    });

    // Links from publisher to channels
    publishedChannels.forEach(ch => {
      links.push({ source: 'publisher', target: `channel_${ch}`, type: 'publish' });
    });

    // Links from channels to subscriber
    activeSubscriptions.forEach(ch => {
      links.push({ source: `channel_${ch}`, target: 'subscriber', type: 'subscribe' });
    });

    return { nodes, links };
  }, [publishedChannels, activeSubscriptions]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleSubscribe = () => {
    if (isSubscribed) {
      // Unsubscribe
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsSubscribed(false);
      setActiveSubscriptions(new Set());
      setStatusMessage({ type: 'success', text: 'Unsubscribed from channels' });
      setLastCommand('');
      return;
    }

    // Subscribe
    const channels = subscribeChannels.split(',').map(c => c.trim()).filter(c => c);
    if (channels.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please enter at least one channel' });
      return;
    }

    setActiveSubscriptions(new Set(channels));
    setLastCommand(`SUBSCRIBE ${channels.join(' ')}`);
    const channelsParam = channels.join(',');
    const eventSource = new EventSource(`/api/pubsub/subscribe?channels=${channelsParam}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') {
          setIsSubscribed(true);
          setStatusMessage({ type: 'success', text: `Subscribed to: ${data.channels.join(', ')}` });
        } else {
          const newMessage: Message = {
            channel: data.channel,
            message: data.message,
            timestamp: new Date(data.timestamp).toLocaleTimeString(),
            id: Math.random().toString(36).substring(2, 11),
          };
          setMessages(prev => [newMessage, ...prev]);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    eventSource.onerror = () => {
      setStatusMessage({ type: 'error', text: 'Connection error. Please try again.' });
      setIsSubscribed(false);
      eventSource.close();
    };

    eventSourceRef.current = eventSource;
  };

  const handlePublish = async () => {
    if (!channel || !publishMessage) {
      setStatusMessage({ type: 'error', text: 'Channel and message are required' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setLastCommand(`PUBLISH ${channel} "${publishMessage}"`);

    try {
      const response = await fetch('/api/pubsub/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, message: publishMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish message');
      }

      setSubscriberCount(data.subscriberCount);
      setPublishedChannels(prev => new Set([...prev, channel]));
      setStatusMessage({
        type: 'success',
        text: `Message published to ${data.subscriberCount} subscriber(s) in ${data.executionTime.toFixed(2)}ms`,
      });
    } catch (error) {
      setStatusMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content pubsub-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Pub/Sub Messaging Demo</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {statusMessage && (
            <div className={`status-message ${statusMessage.type}`}>
              {statusMessage.text}
            </div>
          )}

          <div className="pubsub-container">
            {/* Publisher Section */}
            <div className="pubsub-section">
              <h3>Publisher</h3>
              <p className="section-description">Publish messages to a Redis channel</p>

              <div className="input-group">
                <label>Channel Name</label>
                <input
                  type="text"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  disabled={loading}
                  placeholder="notifications"
                />
              </div>

              <div className="input-group">
                <label>Message</label>
                <textarea
                  value={publishMessage}
                  onChange={(e) => setPublishMessage(e.target.value)}
                  disabled={loading}
                  placeholder="Enter your message here..."
                  rows={3}
                />
              </div>

              <button className="primary" onClick={handlePublish} disabled={loading}>
                Publish Message
              </button>

              {subscriberCount !== null && (
                <div className="subscriber-count">
                  <strong>Subscribers:</strong> {subscriberCount}
                </div>
              )}
            </div>

            {/* Subscriber Section */}
            <div className="pubsub-section">
              <h3>Subscriber</h3>
              <p className="section-description">Subscribe to channels and receive real-time messages</p>

              <div className="input-group">
                <label>Channels (comma-separated)</label>
                <input
                  type="text"
                  value={subscribeChannels}
                  onChange={(e) => setSubscribeChannels(e.target.value)}
                  disabled={isSubscribed}
                  placeholder="notifications,updates"
                />
              </div>

              <div className="button-group">
                <button
                  className={isSubscribed ? 'secondary' : 'primary'}
                  onClick={handleSubscribe}
                >
                  {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                </button>
                {messages.length > 0 && (
                  <button className="secondary" onClick={clearMessages}>
                    Clear Messages
                  </button>
                )}
              </div>

              <div className="messages-container">
                <div className="messages-header">
                  <strong>Received Messages ({messages.length})</strong>
                  {isSubscribed && <span className="status-indicator active">● Live</span>}
                </div>
                <div className="messages-list">
                  {messages.length === 0 ? (
                    <div className="no-messages">
                      {isSubscribed ? 'Waiting for messages...' : 'Not subscribed. Click "Subscribe" to start receiving messages.'}
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="message-item">
                        <div className="message-header">
                          <span className="message-channel">#{msg.channel}</span>
                          <span className="message-time">{msg.timestamp}</span>
                        </div>
                        <div className="message-content">{msg.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Network Graph Visualization */}
          {(publishedChannels.size > 0 || activeSubscriptions.size > 0) && (
            <div className="network-graph-section">
              <h3>Pub/Sub Network Topology</h3>
              <p className="section-description">
                Visualizing the relationship between publishers, channels, and subscribers
              </p>
              <div className="network-graph-container">
                <ForceGraph2D
                  graphData={networkData}
                  nodeLabel="label"
                  nodeColor={(node: any) => {
                    if (node.type === 'publisher') return '#ef4444';
                    if (node.type === 'channel') return '#3b82f6';
                    if (node.type === 'subscriber') return '#10b981';
                    return '#6b7280';
                  }}
                  nodeRelSize={8}
                  nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = node.label;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);

                    // Draw node circle
                    ctx.fillStyle = node.type === 'publisher' ? '#ef4444' :
                                   node.type === 'channel' ? '#3b82f6' :
                                   node.type === 'subscriber' ? '#10b981' : '#6b7280';
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
                    ctx.fill();

                    // Draw label background
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    ctx.fillRect(
                      node.x - bckgDimensions[0] / 2,
                      node.y + 10,
                      bckgDimensions[0],
                      bckgDimensions[1]
                    );

                    // Draw label text
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(label, node.x, node.y + 10 + fontSize / 2);
                  }}
                  linkColor={(link: any) => {
                    return link.type === 'publish' ? '#ef4444' : '#10b981';
                  }}
                  linkWidth={2}
                  linkDirectionalArrowLength={6}
                  linkDirectionalArrowRelPos={1}
                  linkDirectionalParticles={2}
                  linkDirectionalParticleWidth={2}
                  width={800}
                  height={400}
                  backgroundColor="var(--bg-secondary)"
                />
              </div>
              <div className="network-legend">
                <div className="legend-item">
                  <span className="legend-color" style={{ background: '#ef4444' }}></span>
                  <span>Publisher</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ background: '#3b82f6' }}></span>
                  <span>Channel</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ background: '#10b981' }}></span>
                  <span>Subscriber</span>
                </div>
              </div>
            </div>
          )}

          {lastCommand && (
            <div className="redis-command">
              <strong>Redis Command:</strong>
              <code>{lastCommand}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
