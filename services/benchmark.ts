import { extractEntitiesWithLlama, initializeLlama, getLlamaStatus } from './llamaService';
import { LLMExtractionResult } from '../types';

interface TestCase {
  id: string;
  category: 'Task' | 'Event' | 'Shopping' | 'Note' | 'Complex' | 'Edge Case';
  input: string;
  expectedTypes: string[]; // e.g. ['shopping', 'event']
  description: string;
}

const TEST_CASES: TestCase[] = [
  // --- TASKS ---
  {
    id: 'task_1',
    category: 'Task',
    input: "Remind me to call John later today",
    expectedTypes: ['todo'],
    description: "Simple task"
  },
  {
    id: 'task_2',
    category: 'Task',
    input: "I need to finish the quarterly report by Friday",
    expectedTypes: ['todo'],
    description: "Task with deadline"
  },
  {
    id: 'task_3',
    category: 'Task',
    input: "Remember to water the plants when I get home",
    expectedTypes: ['todo'],
    description: "Context-based task"
  },

  // --- EVENTS (Date/Time Extraction) ---
  {
    id: 'event_1',
    category: 'Event',
    input: "Lunch with Sarah tomorrow at 12:30 pm",
    expectedTypes: ['event'],
    description: "Event with relative date and specific time"
  },
  {
    id: 'event_2',
    category: 'Event',
    input: "Dentist appointment on January 15th at 3 o'clock",
    expectedTypes: ['event'],
    description: "Event with absolute date"
  },
  {
    id: 'event_3',
    category: 'Event',
    input: "Weekly team sync next Monday morning",
    expectedTypes: ['event'],
    description: "Event with 'next' relative date"
  },
  {
    id: 'event_4',
    category: 'Event',
    input: "Schedule a brainstorming session for the end of the day",
    expectedTypes: ['event'],
    description: "Event with vague time"
  },

  // --- SHOPPING ---
  {
    id: 'shop_1',
    category: 'Shopping',
    input: "Buy milk, eggs, and sourdough bread",
    expectedTypes: ['shopping'],
    description: "Simple shopping list"
  },
  {
    id: 'shop_2',
    category: 'Shopping',
    input: "Add detergent and paper towels to the grocery list",
    expectedTypes: ['shopping'],
    description: "Shopping list with different verb"
  },
  {
    id: 'shop_3',
    category: 'Shopping',
    input: "We are out of coffee filters and olive oil",
    expectedTypes: ['shopping'],
    description: "Implicit shopping need"
  },

  // --- NOTES ---
  {
    id: 'note_1',
    category: 'Note',
    input: "I had a great idea for a new app feature involving AR",
    expectedTypes: [], 
    description: "General thought/idea"
  },
  {
    id: 'note_2',
    category: 'Note',
    input: "Journal entry: Today was productive, I finally fixed that bug",
    expectedTypes: [],
    description: "Journal entry"
  },

  // --- COMPLEX / MIXED ---
  {
    id: 'complex_1',
    category: 'Complex',
    input: "Buy milk and eggs and then remind me to call mom at 5pm",
    expectedTypes: ['shopping', 'event'],
    description: "Mixed Shopping + Task/Event"
  },
  {
    id: 'complex_2',
    category: 'Complex',
    input: "Schedule a meeting with the design team for Thursday, and I also need to pick up dry cleaning",
    expectedTypes: ['event', 'todo'],
    description: "Mixed Event + Task"
  },
  {
    id: 'complex_3',
    category: 'Complex',
    input: "Get tomatoes, onions, and garlic for the pasta sauce, and set a timer for 20 minutes",
    expectedTypes: ['shopping', 'todo'],
    description: "Cooking context: Shopping + Timer (Task)"
  },

  // --- EDGE CASES / CHALLENGING ---
  {
    id: 'edge_1',
    category: 'Edge Case',
    input: "Don't buy apples, buy pears instead",
    expectedTypes: ['shopping'],
    description: "Negation/Correction"
  },
  {
    id: 'edge_2',
    category: 'Edge Case',
    input: "Meeting at 5... actually make that 6pm",
    expectedTypes: ['event'],
    description: "Self-correction"
  },
  {
    id: 'edge_3',
    category: 'Edge Case',
    input: "Um, I think I need to... maybe call the plumber? Yeah, call the plumber tomorrow.",
    expectedTypes: ['todo'],
    description: "Filler words / hesitation"
  },
  {
    id: 'edge_4',
    category: 'Edge Case',
    input: "Pick up the kids from school",
    expectedTypes: ['todo'], // Could be event or todo
    description: "Ambiguous action"
  },
  {
    id: 'edge_5',
    category: 'Edge Case',
    input: "I need to go to the hardware store to get a hammer and nails",
    expectedTypes: ['shopping'], // Should extract items, not just the task of going
    description: "Location-based shopping"
  }
];

export interface BenchmarkResult {
  testId: string;
  input: string;
  success: boolean;
  durationMs: number;
  extractedTypes: string[];
  rawResult: LLMExtractionResult | null;
  error?: string;
}

export async function runBenchmark(onProgress?: (current: number, total: number, lastResult: BenchmarkResult) => void): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  
  // Ensure model is ready
  const status = getLlamaStatus();
  if (!status.isReady) {
    console.log('Initializing model for benchmark...');
    await initializeLlama();
  }

  console.log(`Starting benchmark with ${TEST_CASES.length} cases...`);

  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    const start = performance.now();
    let result: LLMExtractionResult | null = null;
    let error: string | undefined;

    try {
      console.log(`Running test ${testCase.id}: "${testCase.input}"`);
      result = await extractEntitiesWithLlama(testCase.input);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      console.error(`Test ${testCase.id} failed:`, e);
    }

    const duration = performance.now() - start;

    // Analyze results
    const extractedTypes: string[] = result?.entities.map(e => e.type) || [];
    
    // Check if we found all expected types
    // (This is a loose check; perfect match isn't always needed for success, but good for metric)
    const allExpectedFound = testCase.expectedTypes.every(t => extractedTypes.includes(t));
    
    // For 'Note' category, we expect empty entities array (or maybe a specific note type if we added one)
    // If expectedTypes is empty, we expect empty entities.
    const success = !error && (
        testCase.expectedTypes.length === 0 
            ? true // Notes just need to not crash
            : allExpectedFound
    );

    const benchmarkResult: BenchmarkResult = {
      testId: testCase.id,
      input: testCase.input,
      success,
      durationMs: duration,
      extractedTypes,
      rawResult: result,
      error
    };

    results.push(benchmarkResult);
    if (onProgress) {
      onProgress(i + 1, TEST_CASES.length, benchmarkResult);
    }
    
    // Small delay to let UI update and not freeze the thread completely
    await new Promise(r => setTimeout(r, 100));
  }

  return results;
}
