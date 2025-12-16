import { LLMExtractionResult } from '../types';

// Helper to parse time from text (returns 24h format or null)
function parseTime(text: string): string | null {
  // Match patterns like "10 AM", "4 PM", "10:30 AM", "14:00"
  const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?/i);
  if (!timeMatch) return null;
  
  let hours = parseInt(timeMatch[1]);
  const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
  const ampm = timeMatch[3]?.toLowerCase();
  
  if (ampm === 'pm' && hours < 12) hours += 12;
  if (ampm === 'am' && hours === 12) hours = 0;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Helper to get date from text
function getDateFromText(text: string): string {
  const today = new Date();
  const lowerText = text.toLowerCase();
  
  // Format as YYYY-MM-DD in local time
  const toLocalISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (lowerText.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toLocalISO(tomorrow);
  }
  
  if (lowerText.includes('next week')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return toLocalISO(nextWeek);
  }
  
  // Check for day of week
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Check for "next [day]" specific logic
  // If user says "Next Monday", it usually means the Monday of next week, not just the upcoming Monday.
  // But strict interpretation varies. Let's assume "next monday" means +1 week if the upcoming monday is very close?
  // For now, let's just find the day match.
  
  for (let i = 0; i < days.length; i++) {
    if (lowerText.includes(days[i])) {
      const currentDay = today.getDay();
      let daysUntil = i - currentDay;
      
      // If today is Monday and user says "Monday", do they mean today or next week?
      // Usually "this monday" vs "next monday".
      // Logic: If target is today or past, add 7 days (next week).
      // If target is future, keeps it (this week).
      
      if (daysUntil <= 0) daysUntil += 7; 
      
      // If "next monday" is explicitly said, and the calculated Monday is in this week (e.g. today is Sunday, Monday is tomorrow),
      // some people mean the *following* week. But standard fallback logic usually implies "upcoming".
      // Let's stick to "upcoming" for consistency.
      
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + daysUntil);
      return toLocalISO(targetDate);
    }
  }
  
  return toLocalISO(today);
}

// Split transcript into semantic segments
function splitIntoSegments(transcript: string): string[] {
  // Split by sentence-like delimiters and conjunctions
  const segments = transcript
    .split(/[.!?]+/)
    .flatMap(s => s.split(/\s+(?:also|and\s+then|then)\s+/i))
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  return segments;
}

// Check if segment is about shopping
function isShoppingSegment(segment: string): boolean {
  const lower = segment.toLowerCase();
  return lower.includes('buy') || 
         lower.includes('shopping') || 
         lower.includes('grocery') || 
         lower.includes('get some') ||
         lower.includes('pick up') ||
         lower.includes('need to get');
}

// Check if segment is about an appointment/event
function isEventSegment(segment: string): boolean {
  const lower = segment.toLowerCase();
  return lower.includes('appointment') || 
         lower.includes('meeting') || 
         lower.includes('doctor') ||
         lower.includes('dentist') ||
         lower.includes('interview') ||
         lower.includes('class') ||
         lower.includes('session') ||
         lower.includes('game') ||
         lower.includes('match') ||
         lower.includes('practice') ||
         (lower.includes('at') && /(\d{1,2}:\d{2})|(\d{1,2}\s*(?:am|pm))/i.test(segment));
}

// Extract shopping items from a segment
function extractShoppingItems(segment: string): string[] {
  let itemsText = segment;
  
  // Remove common prefixes
  itemsText = itemsText
    .replace(/(?:i\s+)?(?:need to\s+)?(?:go to\s+)?(?:the\s+)?(?:grocery\s+)?(?:shop|store)\s*(?:and\s+)?/gi, '')
    .replace(/(?:and\s+)?(?:get|buy|pick up)\s+(?:some\s+)?/gi, '')
    .replace(/on\s+(?:the|my)\s+way/gi, '')
    .trim();
  
  // Split by commas, "and", and other separators
  const items = itemsText
    .split(/,\s*|\s+and\s+/i)
    .map(item => item.trim())
    .filter(item => {
      const lower = item.toLowerCase();
      return item.length > 1 && 
             item.length < 50 && // Reasonable item length
             !lower.includes('appointment') && 
             !lower.includes('meeting') &&
             !lower.includes('also') &&
             !lower.includes('have a') &&
             !lower.includes('i have') &&
             !lower.includes('need to') &&
             !/\d{1,2}\s*(?:am|pm)/i.test(item); // Not a time
    });
  
  return items;
}

// Extract event details from a segment
function extractEventDetails(segment: string): { content: string; time: string | null } {
  // Extract time
  const timeMatch = segment.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  const time = timeMatch ? parseTime(timeMatch[1]) : null;
  
  let content = segment;
  
  // Try to extract what the appointment is for
  const forMatch = segment.match(/for\s+(?:the\s+)?([^,.]+)/i);
  if (forMatch) {
    content = forMatch[1].trim();
  } else {
    // Try to extract the purpose
    content = content
      .replace(/(?:i\s+)?(?:have\s+)?(?:a\s+)?appointment/gi, '')
      .replace(/(?:i\s+)?(?:have\s+)?(?:a\s+)?meeting/gi, '')
      .replace(/at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi, '')
      .replace(/in\s+the\s+(morning|evening|afternoon)/gi, '')
      .replace(/^\s*(?:a|the|with|for)\s*/i, '')
      .trim();
  }
  
  // If content still contains appointment keywords, try harder
  if (content.toLowerCase().includes('appointment') || content.toLowerCase().includes('meeting')) {
    // Look for what comes after "appointment" or "meeting"
    const afterMatch = segment.match(/(?:appointment|meeting)\s+(?:with\s+)?(?:the\s+)?(\w+(?:\s+\w+)?)/i);
    if (afterMatch) {
      content = afterMatch[1].trim();
    }
  }
  
  // Add context for common appointment types
  const lower = segment.toLowerCase();
  if (lower.includes('doctor') && !content.toLowerCase().includes('doctor')) {
    content = 'doctor ' + content;
  }
  if (lower.includes('dentist') && !content.toLowerCase().includes('dentist')) {
    content = 'dentist ' + content;
  }
  
  return { content: content || 'appointment', time };
}

// Enhanced fallback extraction using smart pattern matching
export function fallbackExtraction(transcript: string): LLMExtractionResult {
  const entities: LLMExtractionResult['entities'] = [];
  const segments = splitIntoSegments(transcript);
  const processedContents = new Set<string>();
  
  console.log('Processing segments:', segments);
  
  for (const segment of segments) {
    const lower = segment.toLowerCase();
    
    // Handle shopping segments
    if (isShoppingSegment(segment)) {
      const items = extractShoppingItems(segment);
      if (items.length > 0) {
        const itemsContent = items.join(', ');
        if (!processedContents.has(itemsContent)) {
          processedContents.add(itemsContent);
          entities.push({
            type: 'shopping',
            content: itemsContent,
            metadata: { items },
          });
        }
      }
    }
    
    // Handle event/appointment segments
    if (isEventSegment(segment)) {
      const { content, time } = extractEventDetails(segment);
      const eventDate = getDateFromText(transcript);
      
      if (content && content.length > 1 && !processedContents.has(content)) {
        processedContents.add(content);
        entities.push({
          type: 'event',
          content: time ? `${content} at ${time}` : content,
          metadata: { 
            eventDate,
            eventTime: time,
          },
        });
      }
    }
    
    // Handle reminders
    if (lower.includes('remind') || lower.includes('reminder') || lower.includes("don't forget")) {
      const reminderMatch = segment.match(/(?:remind(?:er)?|don't forget)[^.]*?(?:to\s+)?([^.]+)/i);
      if (reminderMatch) {
        const content = reminderMatch[1].trim();
        if (!processedContents.has(content)) {
          processedContents.add(content);
          entities.push({
            type: 'reminder',
            content,
            metadata: { reminderTime: new Date(Date.now() + 3600000).toISOString() },
          });
        }
      }
    }
    
    // Handle todos
    if ((lower.includes('need to') || lower.includes('have to') || 
         lower.includes('todo') || lower.includes('task')) &&
        !isShoppingSegment(segment) && !isEventSegment(segment)) {
      const todoMatch = segment.match(/(?:need to|have to|todo|task)[^.]*?([^.]+)/i);
      if (todoMatch) {
        const content = todoMatch[1].trim();
        if (!processedContents.has(content)) {
          processedContents.add(content);
          entities.push({
            type: 'todo',
            content,
            metadata: { priority: 'medium' },
          });
        }
      }
    }
    
    // Handle ideas
    if (lower.includes('idea') || lower.includes('thought about')) {
      const ideaMatch = segment.match(/(?:idea|thought about)[^.]*?([^.]+)/i);
      if (ideaMatch) {
        const content = ideaMatch[1].trim();
        if (!processedContents.has(content)) {
          processedContents.add(content);
          entities.push({
            type: 'idea',
            content,
            metadata: {},
          });
        }
      }
    }
  }
  
  // If no specific entities found, create a general note
  if (entities.length === 0) {
    entities.push({
      type: 'note',
      content: transcript,
      metadata: {},
    });
  }
  
  console.log('Extracted entities:', JSON.stringify(entities, null, 2));
  
  return {
    entities,
    completions: [],
    summary: `Extracted ${entities.length} item(s) from voice note`,
  };
}
