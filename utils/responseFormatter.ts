/**
 * Response formatter utilities to enhance AI responses with better formatting
 * Converts plain text responses into structured markdown with bullets and proper formatting
 */

export const formatListResponse = (response: string): string => {
  // If response already has markdown formatting, leave it as is
  if (response.includes('•') || response.includes('**') || response.includes('-')) {
    return response;
  }

  // Convert numbered lists (1. 2. 3.) to maintain structure
  if (response.match(/^\d+\./m)) {
    return response;
  }

  // Convert "and" separated items to bullets
  if (response.includes(' and ') && response.length > 100) {
    const items = response.split(' and ').map(item => item.trim());
    if (items.length > 2) {
      return items.map(item => `• ${item}`).join('\n');
    }
  }

  return response;
};

export const enhanceResponseWithEmoji = (response: string, intent: string): string => {
  const emojiMap: Record<string, string> = {
    performance: '📊',
    planning: '📅',
    financial: '💰',
    coaching: '🎯',
    general: '💡',
  };

  const emoji = emojiMap[intent] || '💡';
  
  // Add emoji to beginning if not already present
  if (!response.match(/^[^\w]/)) {
    return `${emoji} ${response}`;
  }

  return response;
};

export const sanitizeNumber = (value: number | string): string => {
  if (typeof value === 'string') return value;
  if (value % 1 !== 0) return value.toFixed(2);
  return value.toString();
};

export const formatPercentage = (current: number, previous: number): string => {
  if (previous === 0) return 'N/A';
  const change = ((current - previous) / previous) * 100;
  const direction = change > 0 ? '📈 +' : '📉 ';
  return `${direction}${Math.round(change)}%`;
};

export const truncateReview = (review: string, maxLength: number = 150): string => {
  if (review.length <= maxLength) return review;
  return review.substring(0, maxLength).trim() + '...';
};
