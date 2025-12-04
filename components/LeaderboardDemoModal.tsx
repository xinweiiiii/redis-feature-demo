'use client';

import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  rank: number;
  player: string;
  score: number;
  isTarget?: boolean;
}

interface LeaderboardDemoModalProps {
  onClose: () => void;
}

export default function LeaderboardDemoModal({ onClose }: LeaderboardDemoModalProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [redisCommand, setRedisCommand] = useState('');

  // Form inputs
  const [playerName, setPlayerName] = useState('');
  const [playerScore, setPlayerScore] = useState('');
  const [searchPlayer, setSearchPlayer] = useState('');
  const [incrementPlayer, setIncrementPlayer] = useState('');
  const [incrementAmount, setIncrementAmount] = useState('');

  // Data
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerRank, setPlayerRank] = useState<any>(null);
  const [playersAround, setPlayersAround] = useState<LeaderboardEntry[]>([]);

  const leaderboardName = 'demo:leaderboard';

  // Load initial leaderboard
  useEffect(() => {
    loadLeaderboard();
  }, []);

  // Load top leaderboard
  const loadLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard/top', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderboard: leaderboardName,
          count: 10,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  // Add player score
  const addScore = async () => {
    if (!playerName || !playerScore) {
      setStatusMessage({ type: 'error', text: 'Please enter both player name and score' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`ZADD ${leaderboardName} ${playerScore} "${playerName}"`);

    try {
      const response = await fetch('/api/leaderboard/add-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderboard: leaderboardName,
          player: playerName,
          score: parseFloat(playerScore),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `${data.player} added with score ${data.score} (Rank #${data.rank})`
        });
        setPlayerName('');
        setPlayerScore('');
        await loadLeaderboard();
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to add score' });
    } finally {
      setLoading(false);
    }
  };

  // Get player rank
  const getPlayerRank = async () => {
    if (!searchPlayer) {
      setStatusMessage({ type: 'error', text: 'Please enter a player name' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`ZREVRANK ${leaderboardName} "${searchPlayer}"\nZSCORE ${leaderboardName} "${searchPlayer}"\nZCARD ${leaderboardName}`);

    try {
      const response = await fetch('/api/leaderboard/rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderboard: leaderboardName,
          player: searchPlayer,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPlayerRank(data);
        setStatusMessage({
          type: 'success',
          text: `${data.player} is ranked #${data.rank} with score ${data.score}`
        });
      } else {
        setPlayerRank(null);
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to get player rank' });
    } finally {
      setLoading(false);
    }
  };

  // Increment player score
  const incrementScore = async () => {
    if (!incrementPlayer || !incrementAmount) {
      setStatusMessage({ type: 'error', text: 'Please enter both player name and increment amount' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`ZINCRBY ${leaderboardName} ${incrementAmount} "${incrementPlayer}"`);

    try {
      const response = await fetch('/api/leaderboard/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderboard: leaderboardName,
          player: incrementPlayer,
          increment: parseFloat(incrementAmount),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `${data.player} +${data.increment} points → ${data.newScore} (Rank #${data.rank})`
        });
        setIncrementPlayer('');
        setIncrementAmount('');
        await loadLeaderboard();
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to increment score' });
    } finally {
      setLoading(false);
    }
  };

  // Get players around a specific player
  const getPlayersAround = async (player: string) => {
    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`ZREVRANK ${leaderboardName} "${player}"\nZREVRANGE ${leaderboardName} (rank-2) (rank+2) WITHSCORES`);

    try {
      const response = await fetch('/api/leaderboard/around', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderboard: leaderboardName,
          player: player,
          range: 2,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPlayersAround(data.players);
        setStatusMessage({
          type: 'success',
          text: `Showing players around ${player} (Rank #${data.targetRank})`
        });
      } else {
        setPlayersAround([]);
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to get players around' });
    } finally {
      setLoading(false);
    }
  };

  // Clear leaderboard
  const clearLeaderboard = async () => {
    if (!confirm('Are you sure you want to clear the entire leaderboard?')) {
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`DEL ${leaderboardName}`);

    try {
      const response = await fetch('/api/leaderboard/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderboard: leaderboardName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage({ type: 'success', text: data.message });
        setLeaderboard([]);
        setPlayerRank(null);
        setPlayersAround([]);
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to clear leaderboard' });
    } finally {
      setLoading(false);
    }
  };

  // Quick add sample players
  const addSamplePlayers = async () => {
    setLoading(true);
    setStatusMessage(null);

    const samplePlayers = [
      { name: 'Alice', score: 9500 },
      { name: 'Bob', score: 8700 },
      { name: 'Charlie', score: 8200 },
      { name: 'Diana', score: 7800 },
      { name: 'Eve', score: 7500 },
      { name: 'Frank', score: 6900 },
      { name: 'Grace', score: 6400 },
      { name: 'Henry', score: 5800 },
      { name: 'Ivy', score: 5200 },
      { name: 'Jack', score: 4500 },
    ];

    try {
      for (const player of samplePlayers) {
        await fetch('/api/leaderboard/add-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leaderboard: leaderboardName,
            player: player.name,
            score: player.score,
          }),
        });
      }

      setStatusMessage({ type: 'success', text: 'Sample players added!' });
      await loadLeaderboard();
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to add sample players' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content stream-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Redis Leaderboards Demo</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {statusMessage && (
            <div className={`status-message ${statusMessage.type}`}>
              {statusMessage.text}
            </div>
          )}

          {/* Redis Command Display */}
          {redisCommand && (
            <div className="redis-command" style={{ marginBottom: '1rem' }}>
              <strong>Redis Command:</strong>
              <code style={{ whiteSpace: 'pre-wrap' }}>{redisCommand}</code>
            </div>
          )}

          {/* Info Section */}
          <div className="search-section" style={{ background: '#fff3e0', padding: '1rem', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1rem', color: '#e65100' }}>
              🏆 Leaderboard with Redis Sorted Sets
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
              Redis Sorted Sets (ZSET) are perfect for leaderboards. Each member has a score, and Redis automatically
              maintains the ranking order. Operations like adding scores, getting ranks, and retrieving top players are O(log N).
            </p>
          </div>

          {/* Quick Actions */}
          <div className="search-section">
            <h3>Quick Actions</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="primary"
                onClick={addSamplePlayers}
                disabled={loading}
              >
                Add Sample Players
              </button>
              <button
                className="primary"
                onClick={loadLeaderboard}
                disabled={loading}
              >
                Refresh Leaderboard
              </button>
              <button
                className="secondary"
                onClick={clearLeaderboard}
                disabled={loading}
                style={{ background: '#ff5252', color: 'white' }}
              >
                Clear Leaderboard
              </button>
            </div>
          </div>

          {/* Add/Update Score */}
          <div className="search-section">
            <h3>Add or Update Player Score</h3>
            <p className="section-description">
              Use ZADD to add a new player or update existing player's score
            </p>
            <div className="search-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem' }}>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Player name..."
                disabled={loading}
              />
              <input
                type="number"
                value={playerScore}
                onChange={(e) => setPlayerScore(e.target.value)}
                placeholder="Score..."
                disabled={loading}
              />
              <button
                className="primary"
                onClick={addScore}
                disabled={loading || !playerName || !playerScore}
              >
                Add/Update
              </button>
            </div>
          </div>

          {/* Increment Score */}
          <div className="search-section">
            <h3>Increment Player Score</h3>
            <p className="section-description">
              Use ZINCRBY to add points to a player's existing score
            </p>
            <div className="search-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem' }}>
              <input
                type="text"
                value={incrementPlayer}
                onChange={(e) => setIncrementPlayer(e.target.value)}
                placeholder="Player name..."
                disabled={loading}
              />
              <input
                type="number"
                value={incrementAmount}
                onChange={(e) => setIncrementAmount(e.target.value)}
                placeholder="Points to add..."
                disabled={loading}
              />
              <button
                className="primary"
                onClick={incrementScore}
                disabled={loading || !incrementPlayer || !incrementAmount}
              >
                Add Points
              </button>
            </div>
          </div>

          {/* Top Leaderboard */}
          <div className="search-section">
            <h3>🏆 Top 10 Leaderboard</h3>
            <p className="section-description">
              Retrieved using ZREVRANGE with WITHSCORES
            </p>
            {leaderboard.length > 0 ? (
              <div style={{ background: '#f8f9fa', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#dc382d', color: 'white' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Rank</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Player</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Score</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => (
                      <tr
                        key={entry.rank}
                        style={{
                          background: entry.rank <= 3 ? '#fff3e0' : 'white',
                          borderBottom: '1px solid #e0e0e0'
                        }}
                      >
                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                          {entry.rank === 1 && '🥇'}
                          {entry.rank === 2 && '🥈'}
                          {entry.rank === 3 && '🥉'}
                          {entry.rank > 3 && `#${entry.rank}`}
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{entry.player}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                          {entry.score.toLocaleString()}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <button
                            className="secondary"
                            onClick={() => getPlayersAround(entry.player)}
                            disabled={loading}
                            style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                          >
                            Show Around
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666', background: '#f5f5f5', borderRadius: '8px' }}>
                No players yet. Add some players to see the leaderboard!
              </div>
            )}
          </div>

          {/* Get Player Rank */}
          <div className="search-section">
            <h3>Get Player Rank</h3>
            <p className="section-description">
              Use ZREVRANK and ZSCORE to get player's position and score
            </p>
            <div className="search-form">
              <input
                type="text"
                value={searchPlayer}
                onChange={(e) => setSearchPlayer(e.target.value)}
                placeholder="Player name..."
                disabled={loading}
              />
              <button
                className="primary"
                onClick={getPlayerRank}
                disabled={loading || !searchPlayer}
              >
                Get Rank
              </button>
            </div>

            {playerRank && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#e3f2fd', borderRadius: '8px', borderLeft: '4px solid #2196f3' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Player</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1976d2' }}>
                      {playerRank.player}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Rank</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1976d2' }}>
                      #{playerRank.rank}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Score</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1976d2' }}>
                      {playerRank.score.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#666', textAlign: 'center' }}>
                  Out of {playerRank.totalPlayers} total players
                </div>
              </div>
            )}
          </div>

          {/* Players Around */}
          {playersAround.length > 0 && (
            <div className="search-section">
              <h3>Players Around Target</h3>
              <p className="section-description">
                Shows players within ±2 ranks of the selected player
              </p>
              <div style={{ background: '#f8f9fa', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#7b1fa2', color: 'white' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Rank</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Player</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playersAround.map((entry) => (
                      <tr
                        key={entry.rank}
                        style={{
                          background: entry.isTarget ? '#f3e5f5' : 'white',
                          borderBottom: '1px solid #e0e0e0',
                          fontWeight: entry.isTarget ? 'bold' : 'normal'
                        }}
                      >
                        <td style={{ padding: '0.75rem' }}>
                          #{entry.rank}
                          {entry.isTarget && ' 🎯'}
                        </td>
                        <td style={{ padding: '0.75rem' }}>{entry.player}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace' }}>
                          {entry.score.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
