export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

export const categorizeMessage = (text) => {
  // Add logic to categorize messages based on content
  const categories = {
    QUESTION: ['what', 'how', 'why', 'when', 'where', 'can', 'could'],
    COMPLAINT: ['issue', 'problem', 'wrong', 'error', 'bug'],
    FEEDBACK: ['suggest', 'improve', 'better', 'feature'],
  };

  const lowerText = text.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }
  return 'GENERAL';
};

export const validateMessage = (text) => {
  if (!text.trim()) return { isValid: false, error: 'Message cannot be empty' };
  if (text.length > 500) return { isValid: false, error: 'Message too long (max 500 characters)' };
  return { isValid: true, error: null };
};
