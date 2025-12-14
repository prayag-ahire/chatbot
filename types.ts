export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface WorkerProfile {
  id: number;
  name: string;
  imgurl: string;
  contact_number: string;
  rating: number;
  profession: string;
  description: string;
  charges_perhour: number;
  charges_pervisit: number;
  active_status: boolean;
  gender: 'Male' | 'Female' | 'Other';
}

export interface WorkerSettings {
  id: number;
  applanguage: string;
  refercode: number | null;
  referenceid: number | null;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Order {
  id: number;
  clientid: number;
  order_status: number;
  date: string; // ISO date string
  time: string;
  reschedule_comment: string | null;
  cancellation_reason?: string; // Explicit field for AI context
  status_name?: string; // Enriched manually
  client_name?: string; // Enriched via join
}

export interface Review {
  id: number;
  name: string;
  comment: string;
  clientid: number;
  createdat: string;
}

export interface WeekSchedule {
  id?: number;
  workerid: number;
  start_sunday: string; end_sunday: string;
  start_monday: string; end_monday: string;
  start_tuesday: string; end_tuesday: string;
  start_wednesday: string; end_wednesday: string;
  start_thursday: string; end_thursday: string;
  start_friday: string; end_friday: string;
  start_saturday: string; end_saturday: string;
}

export interface MonthSchedule {
  date: string;
  note: string;
  id?: number;
}

export interface WorkerMedia {
  name: string;
  url: string;
  type: 'image' | 'video';
}

export interface SystemBenchmarks {
  avg_rating: number;
  avg_hourly_rate: number;
  avg_schedule_match: number;
  total_workers: number;
}

export interface MonthlyMetric {
  month_name: string; // e.g. "January 2025"
  year: number;
  month: number; // 0-11
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  rescheduled_orders: number;
  estimated_earnings: number;
}

export interface FormulaScores {
  rating_quality: number;
  order_efficiency: number;
  reliability: number;
  engagement: number;
  schedule_match: number;
  location_demand_fit: number;
  experience_score: number;
  overall_performance_score: number;
  percentile_rank: number;
}

export interface CityDemand {
  latitude: number;
  longitude: number;
  order_count: number;
  worker_count: number;
}

export interface ProfessionDemand {
  profession: string;
  order_count: number;
  worker_count: number;
}

export interface GenderStats {
  distribution: {
    Male: number;
    Female: number;
    Other: number;
  };
  total_peers: number;
  my_rank_in_gender: number;
  total_gender_peers: number;
}

export interface AdvancedAnalytics {
  scores: FormulaScores;
  rank: {
    by_score: number;
    by_orders: number;
    total_workers: number;
  };
  top_cities: CityDemand[];
  top_professions: ProfessionDemand[];
  gender_stats: GenderStats;
  profession_stats: {
    avg_rating: number;
    total_peers: number;
  };
}

export interface WorkerContext {
  profile: WorkerProfile;
  settings: WorkerSettings | null;
  location: Location | null;
  orders: Order[];
  reviews: Review[];
  weekSchedule: WeekSchedule | null;
  monthSchedule: MonthSchedule[];
  media: WorkerMedia[];
  benchmarks: SystemBenchmarks;
  analytics: AdvancedAnalytics;
  monthlyHistory: MonthlyMetric[];
  orderSummary: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
    rescheduled: number;
  };
  training: {
    total: number;
    completed: number;
  };
}

export interface WorkerContext {
  profile: WorkerProfile;
  settings: WorkerSettings | null;
  location: Location | null;

  orders: Order[];
  reviews: Review[];

  weekSchedule: WeekSchedule | null;
  week_summary: Array<{ day: string; status: string }>;

  monthSchedule: MonthSchedule[];
  monthlyHistory: MonthlyMetric[];
  currentMonth: MonthlyMetric;

  media: WorkerMedia[];

  // Portfolio analytics (no file URLs exposed to AI)
  portfolioAnalytics: {
    total_images: number;
    total_videos: number;
    last_upload: string | null;
  };

  // Review analytics (no file URLs)
  reviewAnalytics: {
    total_reviews: number;
    total_review_images: number;
    total_review_videos: number;
    last_review_image: string | null;
    last_review_video: string | null;
  };

  // Training analytics
  trainingAnalytics: {
    total: number;
    completed: number;
    pending: number;
    last_completed: string | null;
  };

  // Radius-based peer stats (1km, 5km, 10km, 50km)
  peerRadiusAnalytics: {
    r1km: number;
    r5km: number;
    r10km: number;
    r50km: number;
    profession_in_radius: number;
    gender_in_radius: number;
  };

  // Old fields (kept exactly the same)
  benchmarks: SystemBenchmarks;
  analytics: AdvancedAnalytics;

  orderSummary: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
    rescheduled: number;
  };

  // Old training summary (kept if you still use it)
  training: {
    total: number;
    completed: number;
  };
}
