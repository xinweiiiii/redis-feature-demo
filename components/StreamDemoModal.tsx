'use client';

import { useState, useEffect } from 'react';

interface Message {
  id: string;
  message: Record<string, string>;
  consumer?: string;
  acknowledged?: boolean;
}

interface StreamInfo {
  totalMessages: number;
  pendingInfo?: {
    total: number;
    consumer1: number;
    consumer2: number;
  };
}

interface StreamDemoModalProps {
  onClose: () => void;
}

export default function StreamDemoModal({ onClose }: StreamDemoModalProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'multiple' | 'fanout'>('single');
  const [redisCommand, setRedisCommand] = useState('');
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);

  // Single consumer state
  const [singleMessages, setSingleMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');

  // Multiple consumers state
  const [consumer1Messages, setConsumer1Messages] = useState<Message[]>([]);
  const [consumer2Messages, setConsumer2Messages] = useState<Message[]>([]);
  const [groupMessageInput, setGroupMessageInput] = useState('');

  // Fan-out pattern state (multiple groups)
  const [group1Messages, setGroup1Messages] = useState<Message[]>([]);
  const [group2Messages, setGroup2Messages] = useState<Message[]>([]);
  const [fanoutMessageInput, setFanoutMessageInput] = useState('');

  const streamName = 'demo:stream';
  const groupName = 'demo:group';
  const fanoutStreamName = 'demo:fanout-stream';
  const group1Name = 'demo:group1';
  const group2Name = 'demo:group2';

  // Fetch stream info on tab change
  useEffect(() => {
    fetchStreamInfo();
  }, [activeTab]);

  // Fetch stream info
  const fetchStreamInfo = async () => {
    try {
      const currentStream = activeTab === 'fanout' ? fanoutStreamName : streamName;
      const currentGroup = activeTab === 'multiple' ? groupName : undefined;

      const response = await fetch('/api/stream/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream: currentStream,
          group: currentGroup,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStreamInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch stream info:', error);
    }
  };

  // Producer: Add message to stream
  const addMessage = async (message: string, isGroup: boolean = false) => {
    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`XADD ${streamName} * type message data "${message}"`);

    try {
      const response = await fetch('/api/stream/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream: streamName,
          message: { type: 'message', data: message },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage({ type: 'success', text: `Message added with ID: ${data.messageId}` });
        if (isGroup) {
          setGroupMessageInput('');
        } else {
          setMessageInput('');
        }
        await fetchStreamInfo();
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to add message' });
    } finally {
      setLoading(false);
    }
  };

  // Consumer: Read messages
  const readMessages = async () => {
    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`XREAD COUNT 10 STREAMS ${streamName} 0`);

    try {
      const response = await fetch('/api/stream/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream: streamName,
          count: 10,
          lastId: '0',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSingleMessages(data.messages);
        setStatusMessage({ type: 'success', text: `Read ${data.count} messages` });
        await fetchStreamInfo();
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to read messages' });
    } finally {
      setLoading(false);
    }
  };

  // Create consumer group
  const createConsumerGroup = async () => {
    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`XGROUP CREATE ${streamName} ${groupName} 0 MKSTREAM`);

    try {
      const response = await fetch('/api/stream/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          stream: streamName,
          group: groupName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage({ type: 'success', text: data.message });
        await fetchStreamInfo();
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to create consumer group' });
    } finally {
      setLoading(false);
    }
  };

  // Consumer group: Read messages from a specific consumer
  const readGroupMessages = async (consumerName: string) => {
    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`XREADGROUP GROUP ${groupName} ${consumerName} COUNT 5 STREAMS ${streamName} >`);

    try {
      const response = await fetch('/api/stream/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'read',
          stream: streamName,
          group: groupName,
          consumer: consumerName,
          count: 5,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const messagesWithConsumer = data.messages.map((msg: Message) => ({
          ...msg,
          consumer: consumerName,
          acknowledged: false,
        }));

        // Update individual consumer lists
        if (consumerName === 'consumer1') {
          setConsumer1Messages(prev => [...prev, ...messagesWithConsumer]);
        } else if (consumerName === 'consumer2') {
          setConsumer2Messages(prev => [...prev, ...messagesWithConsumer]);
        }

        setStatusMessage({
          type: 'success',
          text: `${consumerName} read ${data.count} messages`
        });
        await fetchStreamInfo();
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to read messages' });
    } finally {
      setLoading(false);
    }
  };

  // Acknowledge messages
  const acknowledgeMessages = async (messageIds: string[]) => {
    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`XACK ${streamName} ${groupName} ${messageIds.join(' ')}`);

    try {
      const response = await fetch('/api/stream/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream: streamName,
          group: groupName,
          messageIds,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Mark messages as acknowledged
        setConsumer1Messages(prev =>
          prev.map(msg =>
            messageIds.includes(msg.id) ? { ...msg, acknowledged: true } : msg
          )
        );
        setConsumer2Messages(prev =>
          prev.map(msg =>
            messageIds.includes(msg.id) ? { ...msg, acknowledged: true } : msg
          )
        );

        setStatusMessage({
          type: 'success',
          text: `Acknowledged ${data.acknowledged} messages`
        });
        await fetchStreamInfo();
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to acknowledge messages' });
    } finally {
      setLoading(false);
    }
  };

  // Fan-out: Create multiple consumer groups
  const createFanoutGroups = async () => {
    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`XGROUP CREATE ${fanoutStreamName} ${group1Name} 0 MKSTREAM\nXGROUP CREATE ${fanoutStreamName} ${group2Name} 0 MKSTREAM`);

    try {
      // Create group1
      const response1 = await fetch('/api/stream/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          stream: fanoutStreamName,
          group: group1Name,
        }),
      });

      // Create group2
      const response2 = await fetch('/api/stream/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          stream: fanoutStreamName,
          group: group2Name,
        }),
      });

      const data1 = await response1.json();
      const data2 = await response2.json();

      if (data1.success && data2.success) {
        setStatusMessage({
          type: 'success',
          text: `Created consumer groups: ${group1Name} and ${group2Name}`
        });
        await fetchStreamInfo();
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to create one or more consumer groups' });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to create consumer groups' });
    } finally {
      setLoading(false);
    }
  };

  // Fan-out: Add message to stream
  const addFanoutMessage = async (message: string) => {
    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`XADD ${fanoutStreamName} * type message data "${message}"`);

    try {
      const response = await fetch('/api/stream/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream: fanoutStreamName,
          message: { type: 'message', data: message },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage({ type: 'success', text: `Message added: ${data.messageId}` });
        setFanoutMessageInput('');
        await fetchStreamInfo();
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to add message' });
    } finally {
      setLoading(false);
    }
  };

  // Fan-out: Read messages from a specific group
  const readFanoutMessages = async (groupName: string, setMessages: React.Dispatch<React.SetStateAction<Message[]>>) => {
    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`XREADGROUP GROUP ${groupName} consumer-${groupName} COUNT 10 STREAMS ${fanoutStreamName} >`);

    try {
      const response = await fetch('/api/stream/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'read',
          stream: fanoutStreamName,
          group: groupName,
          consumer: `consumer-${groupName}`,
          count: 10,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const messagesWithGroup = data.messages.map((msg: Message) => ({
          ...msg,
          consumer: groupName,
          acknowledged: false,
        }));

        setMessages(prev => [...prev, ...messagesWithGroup]);

        setStatusMessage({
          type: 'success',
          text: `${groupName} read ${data.count} messages`
        });
        await fetchStreamInfo();
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to read messages' });
    } finally {
      setLoading(false);
    }
  };

  // Delete all messages from stream
  const deleteAllMessages = async (streamToDelete: string) => {
    if (!confirm(`Are you sure you want to delete all messages from ${streamToDelete}?`)) {
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`XTRIM ${streamToDelete} MAXLEN 0`);

    try {
      const response = await fetch('/api/stream/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream: streamToDelete,
          deleteStream: false, // Just trim messages, keep stream structure
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage({ type: 'success', text: data.message });

        // Clear local state based on active tab
        if (activeTab === 'single') {
          setSingleMessages([]);
        } else if (activeTab === 'multiple') {
          setConsumer1Messages([]);
          setConsumer2Messages([]);
        } else if (activeTab === 'fanout') {
          setGroup1Messages([]);
          setGroup2Messages([]);
        }

        await fetchStreamInfo();
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to delete messages' });
    } finally {
      setLoading(false);
    }
  };

  // Clear pending list for consumer group
  const clearPendingList = async (streamName: string, groupName: string) => {
    if (!confirm(`Are you sure you want to clear the pending list for ${groupName}?\n\nThis will acknowledge all pending messages (they remain in the stream but are removed from PEL).`)) {
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`XPENDING ${streamName} ${groupName} - + 10000\nXACK ${streamName} ${groupName} [all message IDs]`);

    try {
      const response = await fetch('/api/stream/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream: streamName,
          group: groupName,
          clearPending: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: data.message
        });

        // Mark all messages as acknowledged in UI
        setConsumer1Messages(prev =>
          prev.map(msg => ({ ...msg, acknowledged: true }))
        );
        setConsumer2Messages(prev =>
          prev.map(msg => ({ ...msg, acknowledged: true }))
        );

        await fetchStreamInfo();
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to clear pending list' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content stream-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Redis Streams Demo</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {statusMessage && (
            <div className={`status-message ${statusMessage.type}`}>
              {statusMessage.text}
            </div>
          )}

          {/* Tabs */}
          <div className="search-section">
            <div className="tab-buttons">
              <button
                className={`tab-button ${activeTab === 'single' ? 'active' : ''}`}
                onClick={() => setActiveTab('single')}
              >
                📤 Single Producer/Consumer
              </button>
              <button
                className={`tab-button ${activeTab === 'multiple' ? 'active' : ''}`}
                onClick={() => setActiveTab('multiple')}
              >
                👥 Multiple Consumers (Same Group)
              </button>
              <button
                className={`tab-button ${activeTab === 'fanout' ? 'active' : ''}`}
                onClick={() => setActiveTab('fanout')}
              >
                🌐 Fan-out (Multiple Groups)
              </button>
            </div>
          </div>

          {/* Redis Command Display */}
          {redisCommand && (
            <div className="redis-command" style={{ marginBottom: '1rem' }}>
              <strong>Redis Command:</strong>
              <code>{redisCommand}</code>
            </div>
          )}

          {/* Stream Info Display */}
          {streamInfo && (
            <div className="search-section" style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <h3 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '1rem' }}>Stream Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: activeTab === 'multiple' ? 'repeat(3, 1fr)' : '1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Total Messages</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc382d' }}>
                    {streamInfo.totalMessages}
                  </div>
                </div>
                {activeTab === 'multiple' && streamInfo.pendingInfo && (
                  <>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Consumer 1 Pending</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2196f3' }}>
                        {streamInfo.pendingInfo.consumer1}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Consumer 2 Pending</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#7b1fa2' }}>
                        {streamInfo.pendingInfo.consumer2}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {activeTab === 'multiple' && streamInfo.pendingInfo && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#666' }}>
                  💡 <strong>Pending messages</strong> are consumed but not yet acknowledged. They remain in the consumer's Pending Entries List (PEL) until XACK is called.
                  <br />
                  <br />
                  📝 <strong>Note:</strong> Acknowledging pending messages (via individual ACK or Clear Pending List) does <strong>NOT delete</strong> messages from the stream - they remain available for other consumer groups.
                </div>
              )}
            </div>
          )}

          {/* Single Producer/Consumer Tab */}
          {activeTab === 'single' && (
            <>
              <div className="search-section">
                <h3>Producer: Add Message</h3>
                <p className="section-description">
                  Add messages to the stream using XADD
                </p>
                <div className="search-form">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Enter message..."
                    disabled={loading}
                    onKeyDown={(e) => e.key === 'Enter' && addMessage(messageInput, false)}
                  />
                  <button
                    className="primary"
                    onClick={() => addMessage(messageInput, false)}
                    disabled={loading || !messageInput}
                  >
                    Add Message
                  </button>
                </div>
              </div>

              <div className="search-section">
                <h3>Consumer: Read Messages</h3>
                <p className="section-description">
                  Read all messages from the stream using XREAD
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="primary"
                    onClick={readMessages}
                    disabled={loading}
                  >
                    Read All Messages
                  </button>
                  <button
                    className="secondary"
                    onClick={() => deleteAllMessages(streamName)}
                    disabled={loading}
                    style={{ background: '#ff5252', color: 'white' }}
                  >
                    Delete All Messages
                  </button>
                </div>

                {singleMessages.length > 0 && (
                  <div className="results-list" style={{ marginTop: '1rem' }}>
                    {singleMessages.map((msg, index) => (
                      <div key={index} className="result-item">
                        <div className="result-header">
                          <h4>Message {index + 1}</h4>
                          <span className="badge distance">ID: {msg.id}</span>
                        </div>
                        <p className="result-description">
                          {JSON.stringify(msg.message)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Multiple Consumers Tab */}
          {activeTab === 'multiple' && (
            <>
              <div className="search-section">
                <h3>Setup Consumer Group</h3>
                <p className="section-description">
                  Create a consumer group to enable multiple consumers
                </p>
                <button
                  className="primary"
                  onClick={createConsumerGroup}
                  disabled={loading}
                >
                  Create Consumer Group
                </button>
              </div>

              <div className="search-section">
                <h3>Producer: Add Message</h3>
                <p className="section-description">
                  Add messages that will be distributed across consumers
                </p>
                <div className="search-form">
                  <input
                    type="text"
                    value={groupMessageInput}
                    onChange={(e) => setGroupMessageInput(e.target.value)}
                    placeholder="Enter message..."
                    disabled={loading}
                    onKeyDown={(e) => e.key === 'Enter' && addMessage(groupMessageInput, true)}
                  />
                  <button
                    className="primary"
                    onClick={() => addMessage(groupMessageInput, true)}
                    disabled={loading || !groupMessageInput}
                  >
                    Add Message
                  </button>
                </div>
              </div>

              <div className="search-section">
                <h3>Consumers: Read Messages</h3>
                <p className="section-description">
                  Each consumer reads different messages from the same stream
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <button
                    className="primary"
                    onClick={() => readGroupMessages('consumer1')}
                    disabled={loading}
                  >
                    Consumer 1 Read
                  </button>
                  <button
                    className="primary"
                    onClick={() => readGroupMessages('consumer2')}
                    disabled={loading}
                  >
                    Consumer 2 Read
                  </button>
                  <button
                    className="secondary"
                    onClick={() => clearPendingList(streamName, groupName)}
                    disabled={loading}
                    style={{ background: '#ff9800', color: 'white' }}
                  >
                    Clear Pending List
                  </button>
                  <button
                    className="secondary"
                    onClick={() => deleteAllMessages(streamName)}
                    disabled={loading}
                    style={{ background: '#ff5252', color: 'white' }}
                  >
                    Delete All Messages
                  </button>
                </div>

                {/* Consumer 1 Messages */}
                {consumer1Messages.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ marginBottom: '0.5rem' }}>Consumer 1 Messages</h4>
                    <div className="results-list">
                      {consumer1Messages.map((msg, index) => (
                        <div key={index} className="result-item">
                          <div className="result-header">
                            <div>
                              <h4>Message {index + 1}</h4>
                              <span className="badge category">Consumer 1</span>
                              {msg.acknowledged ? (
                                <span className="badge price" style={{ marginLeft: '0.5rem', background: '#4caf50', color: 'white' }}>
                                  ✓ Acknowledged
                                </span>
                              ) : (
                                <span className="badge price" style={{ marginLeft: '0.5rem', background: '#ff9800', color: 'white' }}>
                                  ⏳ Pending
                                </span>
                              )}
                            </div>
                            <span className="badge distance">ID: {msg.id.split('-')[0]}</span>
                          </div>
                          <p className="result-description">
                            {JSON.stringify(msg.message)}
                          </p>
                          {!msg.acknowledged && (
                            <button
                              className="secondary"
                              style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}
                              onClick={() => acknowledgeMessages([msg.id])}
                              disabled={loading}
                            >
                              Acknowledge Message
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Consumer 2 Messages */}
                {consumer2Messages.length > 0 && (
                  <div>
                    <h4 style={{ marginBottom: '0.5rem' }}>Consumer 2 Messages</h4>
                    <div className="results-list">
                      {consumer2Messages.map((msg, index) => (
                        <div key={index} className="result-item">
                          <div className="result-header">
                            <div>
                              <h4>Message {index + 1}</h4>
                              <span className="badge category" style={{ background: '#f3e5f5', color: '#7b1fa2' }}>
                                Consumer 2
                              </span>
                              {msg.acknowledged ? (
                                <span className="badge price" style={{ marginLeft: '0.5rem', background: '#4caf50', color: 'white' }}>
                                  ✓ Acknowledged
                                </span>
                              ) : (
                                <span className="badge price" style={{ marginLeft: '0.5rem', background: '#ff9800', color: 'white' }}>
                                  ⏳ Pending
                                </span>
                              )}
                            </div>
                            <span className="badge distance">ID: {msg.id.split('-')[0]}</span>
                          </div>
                          <p className="result-description">
                            {JSON.stringify(msg.message)}
                          </p>
                          {!msg.acknowledged && (
                            <button
                              className="secondary"
                              style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}
                              onClick={() => acknowledgeMessages([msg.id])}
                              disabled={loading}
                            >
                              Acknowledge Message
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Fan-out Pattern Tab */}
          {activeTab === 'fanout' && (
            <>
              <div className="search-section" style={{ background: '#fff3e0', padding: '1rem', borderRadius: '8px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1rem', color: '#e65100' }}>
                  🌐 Fan-out Pattern Explanation
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
                  In this pattern, <strong>multiple consumer groups</strong> each receive <strong>ALL messages</strong> independently.
                  This is useful when different services need to process the same events (e.g., one service logs to database,
                  another sends notifications).
                </p>
              </div>

              <div className="search-section">
                <h3>Setup Consumer Groups</h3>
                <p className="section-description">
                  Create two separate consumer groups that will each receive all messages
                </p>
                <button
                  className="primary"
                  onClick={createFanoutGroups}
                  disabled={loading}
                >
                  Create Both Groups
                </button>
              </div>

              <div className="search-section">
                <h3>Producer: Add Message</h3>
                <p className="section-description">
                  Add a message - both groups will receive it independently
                </p>
                <div className="search-form">
                  <input
                    type="text"
                    value={fanoutMessageInput}
                    onChange={(e) => setFanoutMessageInput(e.target.value)}
                    placeholder="Enter message..."
                    disabled={loading}
                    onKeyDown={(e) => e.key === 'Enter' && addFanoutMessage(fanoutMessageInput)}
                  />
                  <button
                    className="primary"
                    onClick={() => addFanoutMessage(fanoutMessageInput)}
                    disabled={loading || !fanoutMessageInput}
                  >
                    Add Message
                  </button>
                </div>
              </div>

              <div className="search-section">
                <h3>Consumer Groups: Read Messages</h3>
                <p className="section-description">
                  Notice how both groups receive the SAME messages independently
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <button
                    className="primary"
                    onClick={() => readFanoutMessages(group1Name, setGroup1Messages)}
                    disabled={loading}
                  >
                    Group 1 Read
                  </button>
                  <button
                    className="primary"
                    onClick={() => readFanoutMessages(group2Name, setGroup2Messages)}
                    disabled={loading}
                  >
                    Group 2 Read
                  </button>
                  <button
                    className="secondary"
                    onClick={() => deleteAllMessages(fanoutStreamName)}
                    disabled={loading}
                    style={{ background: '#ff5252', color: 'white' }}
                  >
                    Delete All Messages
                  </button>
                </div>

                {/* Group 1 Messages */}
                {group1Messages.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ marginBottom: '0.5rem', color: '#1976d2' }}>📦 Group 1 Messages</h4>
                    <div className="results-list">
                      {group1Messages.map((msg, index) => (
                        <div key={index} className="result-item" style={{ borderLeft: '4px solid #1976d2' }}>
                          <div className="result-header">
                            <div>
                              <h4>Message {index + 1}</h4>
                              <span className="badge category" style={{ background: '#e3f2fd', color: '#1976d2' }}>
                                {group1Name}
                              </span>
                            </div>
                            <span className="badge distance">ID: {msg.id.split('-')[0]}</span>
                          </div>
                          <p className="result-description">
                            {JSON.stringify(msg.message)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Group 2 Messages */}
                {group2Messages.length > 0 && (
                  <div>
                    <h4 style={{ marginBottom: '0.5rem', color: '#388e3c' }}>📦 Group 2 Messages</h4>
                    <div className="results-list">
                      {group2Messages.map((msg, index) => (
                        <div key={index} className="result-item" style={{ borderLeft: '4px solid #388e3c' }}>
                          <div className="result-header">
                            <div>
                              <h4>Message {index + 1}</h4>
                              <span className="badge category" style={{ background: '#e8f5e9', color: '#388e3c' }}>
                                {group2Name}
                              </span>
                            </div>
                            <span className="badge distance">ID: {msg.id.split('-')[0]}</span>
                          </div>
                          <p className="result-description">
                            {JSON.stringify(msg.message)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {group1Messages.length > 0 && group2Messages.length > 0 && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#e8f5e9', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>
                    <strong style={{ color: '#2e7d32' }}>✓ Fan-out Success!</strong>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                      Both groups received the same messages independently. This demonstrates the fan-out pattern
                      where multiple services can process the same event stream.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
