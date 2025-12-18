/// <reference types="vite/client" />
/**
 * API client for communicating with the ProWorker backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
// filepath: c:\Users\PrayagAhire\Downloads\proworker-ai-assistant (3)\frontend\services\apiClient.ts

export interface ChatResponse {
  success: boolean;
  response: string;
  timestamp: string;
  error?: string;
}

/**
 * Send a chat message to the backend API
 * @param userQuestion - The user's question
 * @param workerContext - The worker's data context
 * @returns The AI response
 */
export const sendChatMessage = async (
  userQuestion: string,
  workerContext: any
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userQuestion,
        workerContext,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data: ChatResponse = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get response');
    }

    return data.response;
  } catch (error) {
    console.error('Chat API Error:', error);
    throw error;
  }
};

/**
 * Check if the API is running
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
};
