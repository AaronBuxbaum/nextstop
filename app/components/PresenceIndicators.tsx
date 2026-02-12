'use client';

import styles from './PresenceIndicators.module.css';

interface ActiveUser {
  userId: string;
  userName: string;
  lastActive: number;
}

interface PresenceIndicatorsProps {
  activeUsers: ActiveUser[];
  currentUserId?: string;
}

const AVATAR_COLORS = [
  '#FF3366', '#3b82f6', '#22c55e', '#f59e0b',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function PresenceIndicators({ activeUsers, currentUserId }: PresenceIndicatorsProps) {
  if (!activeUsers || activeUsers.length === 0) return null;

  const otherUsers = activeUsers.filter((u) => u.userId !== currentUserId);

  if (otherUsers.length === 0) return null;

  return (
    <div className={styles.container} aria-label="Active collaborators">
      <div className={styles.avatarGroup}>
        {otherUsers.map((user) => (
          <div
            key={user.userId}
            className={styles.avatar}
            style={{ backgroundColor: getColor(user.userId) }}
            title={user.userName}
          >
            {getInitials(user.userName)}
            <span className={styles.statusDot} />
            <span className={styles.tooltip}>{user.userName}</span>
          </div>
        ))}
      </div>
      <span className={styles.label}>
        {otherUsers.length} {otherUsers.length === 1 ? 'collaborator' : 'collaborators'} online
      </span>
    </div>
  );
}
