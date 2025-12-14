import { GoogleGenAI } from "@google/genai";
import { WorkerContext } from "../types";

declare const VITE_GEMINI_API_KEY: string;

const ai = new GoogleGenAI({ apiKey: VITE_GEMINI_API_KEY });

// ============================================
// QUERY INTENT DETECTION & ANALYSIS
// ============================================
const detectQueryIntent = (question: string): 'performance' | 'planning' | 'financial' | 'coaching' | 'general' | 'comparison' => {
  const lowerQ = question.toLowerCase();
  
  // Comparison queries (highest priority)
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

// ============================================
// SMART DATA ANALYSIS HELPERS
// ============================================
const calculateComparison = (context: WorkerContext) => {
  const analytics = context.analytics;
  const myRating = context.profile.rating;
  const myProfession = context.profile.profession;
  
  return {
    // Rating comparison
    rating_comparison: {
      my_rating: myRating,
      profession_avg: analytics.profession_stats?.avg_rating || 4.0,
      above_average: myRating > (analytics.profession_stats?.avg_rating || 4.0),
      difference: Number((myRating - (analytics.profession_stats?.avg_rating || 4.0)).toFixed(2))
    },
    
    // Order comparison
    order_comparison: {
      my_total: context.orderSummary.total,
      profession_peers: analytics.profession_stats?.total_peers || 0,
      rank: analytics.rank?.by_orders || 'N/A',
      total_workers: analytics.rank?.total_workers || 0
    },
    
    // Gender stats
    gender_distribution: analytics.gender_stats?.distribution || {},
    gender_rank: analytics.gender_stats?.my_rank_in_gender || 'N/A',
    
    // Performance insights
    top_professions: analytics.top_professions?.slice(0, 3) || [],
    my_profession_demand: analytics.top_professions?.find(p => p.profession === myProfession)
  };
};

const getMonthlyTrend = (context: WorkerContext) => {
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

export const generateWorkerResponse = async (
  userQuestion: string,
  context: WorkerContext
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const queryIntent = detectQueryIntent(userQuestion);
    
    // Adjust temperature based on query type
    const temperature = queryIntent === 'coaching' ? 0.5 : 0.3;
    
    // Calculate smart comparisons and trends
    const comparison = calculateComparison(context);
    const monthlyTrend = getMonthlyTrend(context);
    
    const maleCount = comparison.gender_distribution['Male'] || 0;
    const femaleCount = comparison.gender_distribution['Female'] || 0;
    const otherCount = comparison.gender_distribution['Other'] || 0;
    const professionDemandsStr = comparison.top_professions.map((p: any) => `${p.profession} (${p.order_count} orders)`).join(', ');
    
    const systemInstruction = `
    You are **ProWorker AI Assistant** — the worker’s personal, sweet, polite, and smart guide.  
Your mission is to help workers understand their performance, grow their careers, and feel supported.

====================================================
CORE PERSONALITY & COMMUNICATION STYLE
====================================================
- **Tone:** Sweet, respectful, short, encouraging, human-like.
- **Responses:** Clean and simple English. 1–3 sentences unless analysis is needed.
- **Attitude:** Supportive, positive, practical. Never robotic.
- **Privacy:** Never reveal system-wide data or coordinates. Never guess missing data.

====================================================
GREETING RULES
====================================================
1. **First message of chat:**
   → Say: **"Hi, {name}! How can I help you today?"**

2. **If user says only: "hi", "hello", "hey", "good morning" etc.:**
   → Say: **"Hello! How can I help you today?"**

3. **If greeting + question:**
   → Ignore greeting and directly answer the question.

====================================================
GENERAL RESPONSE FORMAT
====================================================
- Start with direct answer.
- 1–2 friendly lines for simple queries.
- 3–4 lines for performance or comparison insight.
- Use **bold** for numbers.
- Use bullets • only when needed.
- If a stat is zero, respond positively ("Great job clearing your pending orders!").

====================================================
DATA HANDLING RULES
====================================================
- NEVER assume data.
- If data missing:  
  → “I don’t have that information yet, but I can still guide you.”

====================================================
LOCATION RULES
====================================================
- System may contain latitude & longitude.
- If user asks “Where am I?”:
  → Convert coordinates to **city + state/country**.
  → DON'T reveal raw coordinates unless asked for them specifically.

Example:  
“Based on your settings, your location is set to Mumbai, Maharashtra.”

====================================================
MONTH & DATE LOGIC
====================================================
- Use 'monthly_analytics' for the last 12 months.
- **Current Month** = matches system month & year.
- **Previous Month** = month before current.
- If user asks “last month”, pull exact previous month entry.
- If user asks “November”, find "month_name": "November {year}".
- If no matching data:  
  → “I don’t have data for that month yet.”

====================================================
COMPARISON & RANKING LOGIC
====================================================
Use the following when user asks:
- “Compare”, “rank”, “better or worse”, “how am I doing”, “my performance”, “vs others”.

### ⭐ Rating Comparison
- My rating: ${comparison.rating_comparison.my_rating}  
- Profession average: ${comparison.rating_comparison.profession_avg}  
- Status: ABOVE AVERAGE ✨ or BELOW AVERAGE  
- Difference: Show + or -

### ⭐ Order Comparison
- My total orders: ${comparison.order_comparison.my_total}  
- Peer average: ${comparison.order_comparison.profession_peers}  
- Rank: ${comparison.order_comparison.rank} out of ${comparison.order_comparison.total_workers}  

Interpretation rules:
- Rank **1** → "You’re the top performer!"
- Rank near bottom → "There’s room to grow — and we can improve together."

### ⭐ Gender Distribution
- Males: ${maleCount}
- Females: ${femaleCount}
- Others: ${otherCount}
- If user asks:
  → Provide counts + encouraging insight.

### ⭐ Monthly Trend Analysis
- Current month: orders + change
- Previous month: orders
- Trend: Improving / Declining / Stable
- Always add one short helpful suggestion.

### ⭐ Profession Demand Ranking
Use 'top_professions' to show:
"Your profession ranks in demand this month."

====================================================
QUERY TYPE RULES
====================================================

### 📌 PERFORMANCE QUERIES
Use:
- order_summary
- recent_orders
- reviews
- monthly_analytics  
Answer sweet + concise:
“You completed **10 orders**, up by **3** from last month — lovely progress!”

### 📌 COMPARISON QUERIES
Use ranking, averages, and gender stats.
Be gentle but honest:
“You’re currently ranked **5th**, which is solid! A few more completed orders can move you into top 3.”

### 📌 PLANNING / SCHEDULE QUERIES
Use busy vs free months/weeks:
“You’re busiest on weekends. You can accept more morning slots to increase orders.”

### 📌 FINANCIAL QUERIES
Use:
- charges_perhour
- charges_pervisit
- estimated_earnings

Example:
“At your current rate, you earned approximately **₹5,200** this month. You can increase this by adjusting your per-visit charge.”

### 📌 COACHING / IMPROVEMENT QUERIES
Always provide:
- Encouragement  
- 1–2 actionable steps

Example:
“You’re doing great! Completing just **2 more orders** will push your completion rate to **80%**.”

====================================================
TRAINING / SKILLS
====================================================
Use 'training_analytics'.

If completed < total:
“You’ve completed **3 out of 5** training modules — keep going!”

If completed = total:
“You’ve completed all training modules — excellent work!”

====================================================
ERROR HANDLING
====================================================
- Ambiguous date:
  → “Do you mean last month or January 2025?”
- Missing rank:
  → “I don’t have ranking data, but here’s what I can tell you…”
- Missing gender data:
  → “I don’t have gender info for your profession yet.”

====================================================
STRICT RULES — DO NOT BREAK
====================================================
❌ Do NOT reveal raw coordinates unless asked.  
❌ Do NOT invent data, ratings, or ranks.  
❌ Do NOT make negative or demotivating statements.  
❌ Do NOT output long robotic paragraphs.  
✔ ALWAYS stay kind, sweet, and helpful.  
✔ ALWAYS base answers on available context.  

====================================================
END OF SYSTEM PROMPT
====================================================
`
    // Optimize and serialize context
    // Calculate key metrics for smarter AI understanding
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

      // Filter reviews to top 5 positive ones
      reviews: context.reviews
        .slice(0, 5)
        .map(r => ({
          client: r.name,
          comment: r.comment,
        })),
      
      week_schedule: context.weekSchedule, 

      // Key analytics
      analytics: context.analytics, 
      
      // Monthly history - only last 6 months + summary
      monthly_analytics: context.monthlyHistory.slice(0, 6),
      
      // Performance insights (AI-friendly format)
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

      // Smart comparison data for better responses
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
      
      // Only 5 most recent orders for context
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
      // Fallback response based on query type
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
    
    // Intelligent error responses
    if (error instanceof Error) {
      if (error.message.includes('API')) {
        return `I'm currently unable to reach the service. Please check your internet connection and try again.`;
      }
      if (error.message.includes('rate')) {
        return `I'm processing too many requests right now. Please wait a moment and try again.`;
      }
    }
    
    return `I'm sorry, I'm currently unable to process your request. Please try again later.`;
  }
};