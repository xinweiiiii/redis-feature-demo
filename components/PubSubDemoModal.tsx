'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  channel: string;
  message: string;
  timestamp: string;
  id: string;
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
            id: Math.random().toString(36).substr(2, 9),
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
