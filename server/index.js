import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// RATE LIMITING & CACHING
// ============================================
const requestQueue = [];
let isProcessing = false;
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS_PER_DAY = 15; // Leave buffer under 20 limit
let requestCount = 0;
let requestCountReset = Date.now() + 24 * 60 * 60 * 1000;

const getCacheKey = (question, workerContext) => {
  return `${question.toLowerCase()}_${workerContext.profile?.id || ''}`;
};

const getCachedResponse = (cacheKey) => {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.response;
  }
  responseCache.delete(cacheKey);
  return null;
};

const setCachedResponse = (cacheKey, response) => {
  responseCache.set(cacheKey, { response, timestamp: Date.now() });
};

const resetDailyCount = () => {
  if (Date.now() > requestCountReset) {
    requestCount = 0;
    requestCountReset = Date.now() + 24 * 60 * 60 * 1000;
  }
};

const canMakeRequest = () => {
  resetDailyCount();
  return requestCount < MAX_REQUESTS_PER_DAY;
};

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================
// GEMINI AI INSTANCE
// ============================================
const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

// ============================================
// HELPER FUNCTIONS (Same as frontend service)
// ============================================
const detectQueryIntent = (question) => {
  const lowerQ = question.toLowerCase();
  
  if (lowerQ.match(/compare|vs|versus|against|better|worse|rank|ranking|position|where do i stand|how do i compare/i)) {
    return 'comparison';
  }
  if (lowerQ.match(/rate|rating|earning|income|charge|pay|cost|money|profit|revenue|price/i)) {
    return 'financial';
  }
  if (lowerQ.match(/schedule|availability|slot|time|when|available|book|slot/i)) {
    return 'planning';
  }
  if (lowerQ.match(/complete|order|cancel|reschedule|status|performance|feedback|quality|male|female|gender|profession|count/i)) {
    return 'performance';
  }
  if (lowerQ.match(/improve|grow|learn|better|skill|training|develop|tip|advice|suggest|help|boost/i)) {
    return 'coaching';
  }
  return 'general';
};

const calculateComparison = (context) => {
  const analytics = context.analytics;
  const myRating = context.profile.rating;
  const myProfession = context.profile.profession;
  
  return {
    rating_comparison: {
      my_rating: myRating,
      profession_avg: analytics.profession_stats?.avg_rating || 4.0,
      above_average: myRating > (analytics.profession_stats?.avg_rating || 4.0),
      difference: Number((myRating - (analytics.profession_stats?.avg_rating || 4.0)).toFixed(2))
    },
    
    order_comparison: {
      my_total: context.orderSummary.total,
      profession_peers: analytics.profession_stats?.total_peers || 0,
      rank: analytics.rank?.by_orders || 'N/A',
      total_workers: analytics.rank?.total_workers || 0
    },
    
    gender_distribution: analytics.gender_stats?.distribution || {},
    gender_rank: analytics.gender_stats?.my_rank_in_gender || 'N/A',
    
    top_professions: analytics.top_professions?.slice(0, 3) || [],
    my_profession_demand: analytics.top_professions?.find(p => p.profession === myProfession)
  };
};

const getMonthlyTrend = (context) => {
  const months = context.monthlyHistory.slice(0, 3);
  if (months.length < 2) return 'insufficient_data';
  
  const current = months[0].total_orders;
  const previous = months[1].total_orders;
  const change = current - previous;
  const percentChange = previous === 0 ? (current > 0 ? 100 : 0) : Math.round((change / previous) * 100);
  
  return {
    current_month: months[0].month_name,
    current_orders: current,
    previous_orders: previous,
    change: change,
    percent_change: percentChange,
    trend: current > previous ? 'improving' : current < previous ? 'declining' : 'stable'
  };
};

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  resetDailyCount();
  res.json({ 
    status: 'API is running', 
    timestamp: new Date(),
    requestsUsed: requestCount,
    requestsRemaining: MAX_REQUESTS_PER_DAY - requestCount
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { userQuestion, workerContext } = req.body;

    if (!userQuestion || !workerContext) {
      return res.status(400).json({ 
        error: 'Missing required fields: userQuestion and workerContext' 
      });
    }

    // Check cache first
    const cacheKey = getCacheKey(userQuestion, workerContext);
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      return res.json({ 
        success: true,
        response: cachedResponse,
        timestamp: new Date(),
        cached: true
      });
    }

    // Check rate limit
    if (!canMakeRequest()) {
      return res.status(429).json({
        error: 'API rate limit exceeded',
        message: 'Daily quota reached. Please try again tomorrow.',
        requestsRemaining: 0,
        resetTime: new Date(requestCountReset)
      });
    }

    // Queue request
    return new Promise((resolve) => {
      requestQueue.push({ userQuestion, workerContext, res, resolve, cacheKey });
      processQueue();
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      message: error.message 
    });
  }
});

// Process request queue
const processQueue = async () => {
  if (isProcessing || requestQueue.length === 0) return;
  
  isProcessing = true;
  const { userQuestion, workerContext, res, resolve, cacheKey } = requestQueue.shift();

  try {
    const responseText = await generateWorkerResponse(userQuestion, workerContext);
    setCachedResponse(cacheKey, responseText);
    requestCount++;
    
    res.json({ 
      success: true,
      response: responseText,
      timestamp: new Date(),
      cached: false
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    
    if (error.status === 429) {
      res.status(429).json({
        error: 'API rate limit exceeded',
        message: 'Service is temporarily at capacity. Please try again in a few moments.',
        requestsRemaining: Math.max(0, MAX_REQUESTS_PER_DAY - requestCount)
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to generate response',
        message: error.message 
      });
    }
  } finally {
    resolve();
    isProcessing = false;
    
    // Process next in queue
    if (requestQueue.length > 0) {
      setTimeout(processQueue, 1000); // 1 second delay between requests
    }
  }
};

// Main function to generate worker response with retry logic
const generateWorkerResponse = async (userQuestion, context, retryCount = 0) => {
  try {
    const model = 'gemini-2.5-flash';
    const queryIntent = detectQueryIntent(userQuestion);
    const temperature = queryIntent === 'coaching' ? 0.5 : 0.3;

    const comparison = calculateComparison(context);
    const monthlyTrend = getMonthlyTrend(context);
    
    const maleCount = comparison.gender_distribution['Male'] || 0;
    const femaleCount = comparison.gender_distribution['Female'] || 0;
    const otherCount = comparison.gender_distribution['Other'] || 0;
    const professionDemandsStr = comparison.top_professions.map((p) => `${p.profession} (${p.order_count} orders)`).join(', ');

    const systemInstruction = `
You are ProWorker AI Assistant. You are the worker's personal, sweet, and helpful guide.

========================================
CORE PERSONALITY & TONE
========================================
- **Tone:** Sweet, Short, Encouraging, and Practical
- **Goal:** Help the worker understand their performance and grow their career
- **Privacy:** Strict adherence to privacy - never share system-wide data publicly
- **Language:** ${context.settings?.applanguage || 'English'}

========================================
GREETING & CONVERSATION RULES
========================================
- If user says ONLY "Hi", "Hello", "Good morning", "Hey": Respond
"I am your personal AI assistant.\n
I can assist you with your information like order, rating, review, schedule, etc.\n
I will happy to help you 😊"
- If a greeting is paired with a question: Answer the question, don't repeat the greeting
- Keep context of conversation: Don't repeat previous answers unnecessarily
- Be natural and conversational, not robotic

========================================
SMART COMPARISON & RANKING LOGIC
========================================

**WHEN USER ASKS FOR COMPARISONS:**
1. **Rating Comparison:**
   - My rating: ${comparison.rating_comparison.my_rating}
   - Profession average: ${comparison.rating_comparison.profession_avg}
   - Status: ${comparison.rating_comparison.above_average ? 'ABOVE AVERAGE ✨' : 'BELOW AVERAGE - room to improve'}
   - Difference: ${comparison.rating_comparison.difference > 0 ? '+' : ''}${comparison.rating_comparison.difference}

2. **Order Count Comparison:**
   - My total orders: ${comparison.order_comparison.my_total}
   - My profession peers: ${comparison.order_comparison.profession_peers}
   - My rank: ${comparison.order_comparison.rank} out of ${comparison.order_comparison.total_workers}
   - Interpretation: If rank is 1, I'm the top. If rank is close to total, room to grow.

3. **Gender Distribution:**
   - Males in profession: ${maleCount}
   - Females in profession: ${femaleCount}
   - Others in profession: ${otherCount}
   - My gender rank: ${comparison.gender_rank}

4. **Monthly Trend Analysis:**
   - Current month: ${typeof monthlyTrend !== 'string' ? monthlyTrend.current_orders : 0} orders
   - Previous month: ${typeof monthlyTrend !== 'string' ? monthlyTrend.previous_orders : 0} orders
   - Change: ${typeof monthlyTrend !== 'string' ? (monthlyTrend.change > 0 ? '+' : '') + monthlyTrend.change + ' (' + monthlyTrend.percent_change + '%)' : 'N/A'}
   - Trend: ${typeof monthlyTrend !== 'string' ? monthlyTrend.trend.toUpperCase() : 'INSUFFICIENT DATA'}

5. **Profession Demand Ranking:**
   - Top professions by order volume: ${professionDemandsStr}

========================================
QUERY-SPECIFIC RESPONSE STRATEGIES
========================================

**PERFORMANCE QUERIES** (orders, ratings, completion, feedback):
  - Focus on: order_summary, recent_orders, reviews, monthly_analytics, gender_distribution
  - Always include: current stats + trends + comparisons when relevant
  - Example: "You've completed 10 orders (completing 70%). That's above the profession average of 65%!"

**COMPARISON QUERIES** (compare, rank, vs, better, worse):
  - Use comparison data heavily
  - Provide rankings where available
  - Explain what the rank means (1=best, 100=needs improvement)
  - Always be encouraging even with lower ranks

**PLANNING QUERIES** (schedule, availability, slots):
  - Focus on: week_schedule, monthly_analytics (for busy patterns)
  - Show when you're busiest vs available
  - Suggest: "You get 5 orders in Jan, 2 in Feb - let's boost Feb!"

**FINANCIAL QUERIES** (earnings, rates, revenue):
  - Show: charges_perhour, charges_pervisit, estimated_earnings
  - Calculate: "At current rate, you earned \$X this month"
  - Suggest: "Other electricians charge \$Y - you could increase rates"

**COACHING QUERIES** (improve, grow, skills):
  - Acknowledge: "Your 70% completion is good, but let's reach 90%"
  - Suggest: "Complete 2 more orders = 80% completion rate"
  - Action-focused tips based on actual gaps

========================================
DATA INTERPRETATION RULES
========================================

1. **GENDER QUERIES** ("How many males in my profession?"):
   - Report exact counts from gender_stats.distribution
   - Calculate percentages: (count/total) * 100
   - Example: "There are 45 males (60%), 25 females (33%), 3 others (4%) in your profession"

2. **RANKING QUERIES** ("What's my rank?"):
   - Use rank from analytics.rank.by_orders or analytics.rank.by_score
   - Explain: "You're ranked #3 out of 50 electricians by order count"
   - Never say "You're in the 3rd percentile" - use absolute rank instead

3. **MONTHLY DATA**:
   - Match user's month with monthly_analytics entries
   - If January 2025, find entry with month_name containing "January" AND year: 2025
   - If "last month" and current is Feb, find January data
   - If data not found: "I don't have data for August yet"

4. **TRENDING**:
   - Use getMonthlyTrend logic
   - If trend is 'improving': "Great! You're going up from prev to current orders!"
   - If trend is 'declining': "Orders dipped. Let's boost this next month!"

5. **LOCATION**: NEVER share coordinates. Instead: "I see you're getting orders in the northern area"

========================================
RESPONSE FORMAT RULES
========================================
- **Length:** 2-4 sentences for queries, 5-7 for analysis with comparisons
- **Formatting:** Use bullets (•) for lists, numbers (1. 2. 3.) for steps
- **Emphasis:** **bold** for key numbers, don't overuse italics
- **Tone:** Positive + Practical. If low stats, pair with specific improvement tips
- **Numbers:** Always use "85%" not "0.85", round to whole numbers
- **Avoid:** "0th percentile", vague language, data dumps without context

========================================
ERROR HANDLING GUIDELINES
========================================
- Missing data: "I don't have complete [data] yet" then suggest next steps
- No comparison data: "I don't have enough worker data to compare yet, but your metric is solid!"
- Ambiguous dates: Ask "Did you mean January 2025 or last month?"
- Low stats: ALWAYS pair with actionable tips
- Impossible comparisons: "I can't compare X to Y, but here's what I can tell you..."

========================================
CRITICAL RULES - STRICT DATA VALIDATION
========================================
✓ If rank is missing, DON'T make up a rank
✓ If gender data missing, DON'T guess at numbers
✓ Always acknowledge incomplete data gracefully
✓ Turn "bad news" into "opportunity to improve"
✓ Be specific: "2 more completed orders" not "do better"
✓ Reference actual data: "Your 20% completion rate vs 65% average means..."

========================================
CRITICAL RULES - PREVENT FALSE DATA CLAIMS
========================================
❌ NEVER say "Your location data is on file" unless location is explicitly provided in the data
❌ NEVER assume language preference - always check if settings.applanguage exists
❌ NEVER claim to have data you haven't been given - always verify first
❌ When data is null or missing, say "I don't have that information" instead of making it up
❌ DON'T make statements like "Your profile looks great" without specific metrics
✓ For missing fields: Be honest: "I can't access that right now, but I can help with..."
✓ For null values: Skip them entirely - don't acknowledge they're missing unless asked
✓ Always verify before claiming access: Check if data exists in the provided JSON context
`;

    const completionRate = context.orderSummary.total > 0 
      ? Math.round((context.orderSummary.completed / context.orderSummary.total) * 100)
      : 0;
    
    const avgMonthlyOrders = context.monthlyHistory.length > 0
      ? Math.round(context.monthlyHistory.reduce((sum, m) => sum + m.total_orders, 0) / context.monthlyHistory.length)
      : 0;

    const recentMonths = context.monthlyHistory.slice(0, 3);
    const trend = recentMonths.length >= 2 
      ? recentMonths[0].total_orders >= recentMonths[1].total_orders ? 'increasing' : 'decreasing'
      : 'stable';

    const dataContextString = JSON.stringify({
      my_profile: {
        name: context.profile.name,
        profession: context.profile.profession,
        gender: context.profile.gender,
        current_rating: context.profile.rating,
        charges_perhour: context.profile.charges_perhour,
        charges_pervisit: context.profile.charges_pervisit,
      },
      settings: context.settings, 
      
      location: context.location ? {
        latitude: context.location.latitude,
        longitude: context.location.longitude
      } : null,

      reviews: context.reviews
        .slice(0, 5)
        .map(r => ({
          client: r.name,
          comment: r.comment,
        })),
      
      week_schedule: context.weekSchedule, 
      analytics: context.analytics, 
      monthly_analytics: context.monthlyHistory.slice(0, 6),
      
      performance_metrics: {
        total_orders: context.orderSummary.total,
        completed_orders: context.orderSummary.completed,
        cancelled_orders: context.orderSummary.cancelled,
        pending_orders: context.orderSummary.pending,
        rescheduled_orders: context.orderSummary.rescheduled,
        completion_rate: `${completionRate}%`,
        avg_monthly_orders: avgMonthlyOrders,
        trend: trend,
      },

      comparison_insights: {
        rating: comparison.rating_comparison,
        orders: comparison.order_comparison,
        gender_stats: {
          distribution: comparison.gender_distribution,
          my_rank: comparison.gender_rank
        },
        top_professions: comparison.top_professions,
        monthly_trend: monthlyTrend
      },

      performance_summary: context.orderSummary,
      recent_orders: context.orders.slice(0, 5).map(o => ({
        date: o.date,
        client: o.client_name,
        status: o.status_name,
      })),
    }, null, 2);

    const prompt = `
      CONTEXT DATA (JSON):
      ${dataContextString}

      USER QUESTION:
      "${userQuestion}"

      Query Intent: ${queryIntent.toUpperCase()}

      IMPORTANT INSTRUCTIONS:
      1. Use comparison_insights data to provide ranking and comparison context
      2. If user asks about rank, use the order data from comparison_insights
      3. If user asks about gender distribution, calculate percentages: (count / total * 100)
      4. For monthly comparisons, use monthly_trend from comparison_insights
      5. Always provide specific numbers and actionable insights
      6. For missing data, suggest what you CAN tell them instead
      7. CRITICAL: NEVER claim to have data you haven't been given in the JSON context
      8. NEVER make up or assume data - if location is null, don't mention it
      9. NEVER confirm data exists unless you can see it in the provided context
      10. If a field is null/missing/empty, ignore it - don't acknowledge its absence unless directly asked

      Please analyze the JSON data to answer the user's question. Adhere strictly to the RESPONSE STYLE RULES and use the ${queryIntent.toUpperCase()}-specific strategies if applicable.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: temperature,
      }
    });

    const text = response.text?.trim();
    
    if (!text) {
      if (queryIntent === 'financial') {
        return `I'm having trouble retrieving your earnings data right now. Please try again in a moment.`;
      } else if (queryIntent === 'planning') {
        return `I'm unable to access your schedule at the moment. Please check back soon.`;
      } else if (queryIntent === 'performance') {
        return `I'm having trouble analyzing your performance data. Please try again.`;
      }
      return `I'm having trouble processing your request right now. Please try again.`;
    }

    return text;

  } catch (error) {
    console.error("Gemini API Error:", error);
    
    // Handle rate limit with retry logic
    if (error.status === 429) {
      if (retryCount < 2) {
        const delayMs = Math.pow(2, retryCount) * 2000; // Exponential backoff: 2s, 4s
        console.log(`Rate limited. Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return generateWorkerResponse(userQuestion, context, retryCount + 1);
      }
      // After retries exhausted, throw for parent handler
      throw error;
    }
    
    if (error instanceof Error) {
      if (error.message.includes('API')) {
        return `I'm currently unable to reach the service. Please check your internet connection and try again.`;
      }
    }
    
    throw error;
  }
};

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`✅ ProWorker API running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Chat endpoint: POST http://localhost:${PORT}/api/chat`);
  console.log(`⏱️  Rate limit: ${MAX_REQUESTS_PER_DAY} requests per 24 hours`);
});
