import { supabase } from '../supabaseClient';
import {
  WorkerContext,
  Order,
  Review,
  WorkerProfile,
  WeekSchedule,
  MonthSchedule,
  WorkerMedia,
  SystemBenchmarks,
  WorkerSettings,
  Location,
  AdvancedAnalytics,
  MonthlyMetric,
  FormulaScores,
  CityDemand,
  ProfessionDemand,
  GenderStats
} from '../types';

// STATUS MAP
const STATUS_MAP: Record<number, string> = {
  1: 'Pending',
  2: 'Accepted',
  3: 'Completed',
  4: 'Cancelled',
  5: 'Rescheduled'
};

// ---------------------------------------------
// LIMIT ANY SCORE
// ---------------------------------------------
const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max);

// ---------------------------------------------
// HAVERSINE DISTANCE (KM)
// ---------------------------------------------
const haversine = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ---------------------------------------------
// BUILD WEEKLY SUMMARY
// ---------------------------------------------
const buildWeeklySummary = (week: WeekSchedule | null) => {
  if (!week) return [];

  const days = [
    ["Sunday", week.start_sunday, week.end_sunday],
    ["Monday", week.start_monday, week.end_monday],
    ["Tuesday", week.start_tuesday, week.end_tuesday],
    ["Wednesday", week.start_wednesday, week.end_wednesday],
    ["Thursday", week.start_thursday, week.end_thursday],
    ["Friday", week.start_friday, week.end_friday],
    ["Saturday", week.start_saturday, week.end_saturday],
  ];

  return days.map(([day, start, end]) => ({
    day,
    status: start && end ? `${start} to ${end}` : "Holiday",
  }));
};

// ---------------------------------------------
// NORMALIZE GENDER
// ---------------------------------------------
const normalizeGender = (g: string | null): 'Male' | 'Female' | 'Other' => {
  if (!g) return 'Other';
  const lower = g.toLowerCase().trim();
  if (lower === 'male' || lower === 'm') return 'Male';
  if (lower === 'female' || lower === 'f') return 'Female';
  return 'Other';
};

// ---------------------------------------------
// NORMALIZE PROFESSION
// ---------------------------------------------
const normalizeProf = (p: string | null): string => {
  return p ? p.toLowerCase().trim() : 'unknown';
};

// ---------------------------------------------
// FETCH WORKER DATA
// ---------------------------------------------
export const fetchWorkerData = async (workerId: number): Promise<WorkerContext | null> => {
  try {
    const { data: workerData, error: workerError } = await supabase
      .from("worker")
      .select("*")
      .eq("id", workerId)
      .single();

    if (workerError || !workerData) return null;

    const worker: WorkerProfile = workerData as WorkerProfile;

    const { data: settingsData } = await supabase
      .from("workersettings")
      .select("*")
      .eq("workerid", workerId)
      .single();

    let locationData: Location | null = null;
    if (settingsData) {
      const { data: loc } = await supabase
        .from("location")
        .select("latitude, longitude")
        .eq("workersettingsid", settingsData.id)
        .single();
      locationData = loc as Location | null;
    }

    const { data: orderRaw } = await supabase
      .from("workerorder")
      .select("*, client(name, gender)")
      .eq("workerid", workerId)
      .order("date", { ascending: false });

    const orders: Order[] = (orderRaw || []).map((o: any) => ({
      ...o,
      status_name: STATUS_MAP[o.order_status],
      client_name: o.client?.name || "Client",
      client_gender: o.client?.gender || null,
      cancellation_reason:
        o.order_status === 4
          ? o.reschedule_comment || "No reason provided"
          : undefined,
    }));

    const orderSummary = {
      total: orders.length,
      completed: orders.filter(o => o.order_status === 3).length,
      cancelled: orders.filter(o => o.order_status === 4).length,
      pending: orders.filter(o => o.order_status === 1).length,
      rescheduled: orders.filter(o => o.order_status === 5).length,
    };

    const { data: reviewData } = await supabase
      .from("review")
      .select("*")
      .eq("workerid", workerId)
      .order("createdat", { ascending: false });

    const { data: reviewImages } = await supabase
      .from("reviewimage")
      .select("createdat")
      .eq("workerid", workerId);

    const { data: reviewVideos } = await supabase
      .from("reviewvideo")
      .select("createdat")
      .eq("workerid", workerId);

    const reviewAnalytics = {
      total_reviews: reviewData?.length || 0,
      total_review_images: reviewImages?.length || 0,
      total_review_videos: reviewVideos?.length || 0,
      last_review_image: (reviewImages && reviewImages.length > 0) ? reviewImages[reviewImages.length - 1].createdat : null,
      last_review_video: (reviewVideos && reviewVideos.length > 0) ? reviewVideos[reviewVideos.length - 1].createdat : null,
    };

    const { data: workerImages } = await supabase
      .from("workerimage")
      .select("createdat")
      .eq("workerid", workerId);

    const { data: workerVideos } = await supabase
      .from("workervideo")
      .select("createdat")
      .eq("workerid", workerId);

    const mediaUploads = [
      ...(workerImages || []).map(i => i.createdat),
      ...(workerVideos || []).map(v => v.createdat),
    ].sort();

    const portfolioAnalytics = {
      total_images: workerImages?.length || 0,
      total_videos: workerVideos?.length || 0,
      last_upload: mediaUploads.length > 0 ? mediaUploads[mediaUploads.length - 1] : null,
    };

    const { data: imgList } = await supabase
      .from("workerimage")
      .select("name, img_url")
      .eq("workerid", workerId);

    const { data: vidList } = await supabase
      .from("workervideo")
      .select("name, video_url")
      .eq("workerid", workerId);

    const media: WorkerMedia[] = [
      ...(imgList || []).map((i: any) => ({ name: i.name, url: i.img_url, type: "image" } as WorkerMedia)),
      ...(vidList || []).map((v: any) => ({ name: v.name, url: v.video_url, type: "video" } as WorkerMedia)),
    ];

    const { data: trainingData } = await supabase
      .from("workertraining")
      .select("*")
      .eq("workerid", workerId);

    const { count: totalTrainingVideos } = await supabase
      .from("trainingvideo")
      .select("*", { count: "exact", head: true });

    const completedTraining = trainingData?.filter(t => t.status === true) || [];

    const trainingAnalytics = {
      total: totalTrainingVideos || 0,
      completed: completedTraining.length,
      pending: (totalTrainingVideos || 0) - completedTraining.length,
      last_completed: completedTraining.length > 0 ? completedTraining[completedTraining.length - 1].createdat : null,
    };

    const trainingSummary = {
      total: totalTrainingVideos || 0,
      completed: completedTraining.length,
    };

    const { data: weekSchedule } = await supabase
      .from("weekschedule")
      .select("*")
      .eq("workerid", workerId)
      .single();

    const week_summary = buildWeeklySummary(weekSchedule as WeekSchedule | null);

    const { data: monthSchedule } = await supabase
      .from("monthschedule")
      .select("date, note")
      .eq("workerid", workerId)
      .order("date", { ascending: true });

    const monthlyHistoryMap: Record<string, MonthlyMetric> = {};
    const chargesPerVisit = Number(worker.charges_pervisit) || 0;

    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      monthlyHistoryMap[key] = {
        month_name: `${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}`,
        year: d.getFullYear(),
        month: d.getMonth(),
        total_orders: 0,
        completed_orders: 0,
        cancelled_orders: 0,
        rescheduled_orders: 0,
        estimated_earnings: 0,
      };
    }

    orders.forEach(o => {
      const d = new Date(o.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      if (!monthlyHistoryMap[key]) {
        monthlyHistoryMap[key] = {
          month_name: `${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}`,
          year: d.getFullYear(),
          month: d.getMonth(),
          total_orders: 0,
          completed_orders: 0,
          cancelled_orders: 0,
          rescheduled_orders: 0,
          estimated_earnings: 0,
        };
      }

      const entry = monthlyHistoryMap[key];
      entry.total_orders++;

      if (o.order_status === 3) {
        entry.completed_orders++;
        entry.estimated_earnings += chargesPerVisit;
      }
      if (o.order_status === 4) entry.cancelled_orders++;
      if (o.order_status === 5) entry.rescheduled_orders++;
    });

    const monthlyHistory = Object.values(monthlyHistoryMap).sort(
      (a, b) => b.year - a.year || b.month - a.month
    );

    const currentMonth = monthlyHistory[0];

    const { data: allWorkers } = await supabase
      .from("worker")
      .select("id, rating, charges_perhour, profession, gender");

    const { data: allOrders } = await supabase
      .from("workerorder")
      .select("workerid, order_status, date, time");

    const { data: allLocations } = await supabase
      .from("location")
      .select("latitude, longitude, workersettings!inner(workerid)");

    let peerRadiusAnalytics = {
      r1km: 0,
      r5km: 0,
      r10km: 0,
      r50km: 0,
      profession_in_radius: 0,
      gender_in_radius: 0,
    };

    if (locationData && allLocations && allWorkers) {
      const myLat = locationData.latitude;
      const myLng = locationData.longitude;
      const myProf = normalizeProf(worker.profession);
      const myGender = normalizeGender(worker.gender);

      allLocations.forEach((loc: any) => {
        const wId = loc.workersettings?.workerid;
        if (!wId || wId === workerId) return;

        const peer = allWorkers.find((w: any) => w.id === wId);
        if (!peer) return;

        const dist = haversine(myLat, myLng, loc.latitude, loc.longitude);

        if (dist <= 1) peerRadiusAnalytics.r1km++;
        if (dist <= 5) peerRadiusAnalytics.r5km++;
        if (dist <= 10) peerRadiusAnalytics.r10km++;
        if (dist <= 50) peerRadiusAnalytics.r50km++;

        if (dist <= 5 && normalizeProf(peer.profession) === myProf)
          peerRadiusAnalytics.profession_in_radius++;

        if (dist <= 5 && normalizeGender(peer.gender) === myGender)
          peerRadiusAnalytics.gender_in_radius++;
      });
    }

    let scores: FormulaScores = {
      rating_quality: 0, order_efficiency: 0, reliability: 0, engagement: 0, schedule_match: 0,
      location_demand_fit: 0, experience_score: 0, overall_performance_score: 0, percentile_rank: 0,
    };

    let benchmarks: SystemBenchmarks = {
      avg_rating: 0, avg_hourly_rate: 0, avg_schedule_match: 0, total_workers: 0,
    };

    let professionStats = { avg_rating: 0, total_peers: 0 };
    let rankMetrics = { by_score: 0, by_orders: 0, total_workers: 0 };
    let genderStats: GenderStats = {
      distribution: { Male: 0, Female: 0, Other: 0 },
      total_peers: 0,
      my_rank_in_gender: 0,
      total_gender_peers: 0,
    };

    let topProfessions: ProfessionDemand[] = [];
    let topCities: CityDemand[] = [];

    if (allWorkers && allWorkers.length > 0) {
      rankMetrics.total_workers = allWorkers.length;
      const myProf = normalizeProf(worker.profession);
      const myGender = normalizeGender(worker.gender);

      const peers = allWorkers.filter((w: any) => normalizeProf(w.profession) === myProf);
      professionStats.total_peers = peers.length;

      const avgRatingProfession =
        peers.reduce((s: number, w: any) => s + Number(w.rating), 0) / (peers.length || 1);

      professionStats.avg_rating = Number(avgRatingProfession.toFixed(2));

      peers.forEach((p: any) => {
        const g = normalizeGender(p.gender);
        genderStats.distribution[g]++;
      });

      genderStats.total_peers = peers.length;

      const sameGenderPeers = peers.filter((p: any) => normalizeGender(p.gender) === myGender);
      genderStats.total_gender_peers = sameGenderPeers.length;

      const avgRatingAll =
        allWorkers.reduce((sum: number, w: any) => sum + Number(w.rating), 0) /
        allWorkers.length;

      benchmarks = {
        avg_rating: Number(avgRatingAll.toFixed(2)),
        avg_hourly_rate: Number((allWorkers.reduce((sum: number, w: any) => sum + Number(w.charges_perhour), 0) / allWorkers.length).toFixed(0)),
        avg_schedule_match: 0,
        total_workers: allWorkers.length,
      };

      const allWorkerScores = allWorkers.map((w: any) => {
        const wOrders = allOrders.filter((o: any) => o.workerid === w.id);
        const wCompleted = wOrders.filter((o: any) => o.order_status === 3).length;

        const rScore = clamp((Number(w.rating) / avgRatingAll) * 100, 0, 130);
        const eScore =
          wOrders.length > 0
            ? clamp(((wCompleted - (wOrders.length - wCompleted)) / wOrders.length) * 100, 0, 100)
            : 50;

        return {
          id: w.id,
          score: (0.6 * rScore + 0.4 * eScore),
          orderCount: wOrders.length,
          gender: normalizeGender(w.gender),
          profession: normalizeProf(w.profession),
        };
      });

      const sortedScore = [...allWorkerScores].sort((a: any, b: any) => b.score - a.score);
      rankMetrics.by_score =
        sortedScore.findIndex((x) => x.id === workerId) + 1;

      const sortedOrders = [...allWorkerScores].sort(
        (a: any, b: any) => b.orderCount - a.orderCount
      );
      rankMetrics.by_orders =
        sortedOrders.findIndex((x) => x.id === workerId) + 1;

      const myGenderPeers = sortedScore.filter(
        (x) => x.profession === myProf && x.gender === myGender
      );
      genderStats.my_rank_in_gender =
        myGenderPeers.findIndex((x) => x.id === workerId) + 1;

      scores.percentile_rank = Math.round(
        ((allWorkers.length - rankMetrics.by_score) / allWorkers.length) * 100
      );

      const professionMap = new Map<string, { orders: number; workers: Set<number> }>();

      allOrders.forEach((o: any) => {
        const w = allWorkers.find((x: any) => x.id === o.workerid);
        if (!w) return;
        const pName = normalizeProf(w.profession);

        if (!professionMap.has(pName))
          professionMap.set(pName, { orders: 0, workers: new Set() });

        const stats = professionMap.get(pName)!;
        stats.orders++;
        stats.workers.add(w.id);
      });

      topProfessions = Array.from(professionMap.entries())
        .map(([p, data]) => ({
          profession: p,
          order_count: data.orders,
          worker_count: data.workers.size,
        }))
        .sort((a, b) => b.order_count - a.order_count)
        .slice(0, 5);

      const cityMap = new Map<string, CityDemand>();

      if (allLocations) {
        allLocations.forEach((loc: any) => {
          const latKey = Math.round(loc.latitude * 10) / 10;
          const lngKey = Math.round(loc.longitude * 10) / 10;
          const key = `${latKey},${lngKey}`;

          const wId = loc.workersettings?.workerid;
          if (!wId) return;

          if (!cityMap.has(key))
            cityMap.set(key, {
              latitude: latKey,
              longitude: lngKey,
              order_count: 0,
              worker_count: 0,
            });

          const c = cityMap.get(key)!;
          c.worker_count++;

          const wOrders = allOrders.filter((o: any) => o.workerid === wId).length;
          c.order_count += wOrders;
        });
      }

      topCities = [...cityMap.values()].sort(
        (a, b) => b.order_count - a.order_count
      ).slice(0, 10);
    }

    return {
      profile: worker,
      settings: settingsData as WorkerSettings | null,
      location: locationData,

      orders,
      reviews: reviewData as Review[] || [],

      weekSchedule: weekSchedule as WeekSchedule | null,
      week_summary,

      monthSchedule: monthSchedule as MonthSchedule[] || [],

      monthlyHistory,
      currentMonth,

      media,

      portfolioAnalytics,
      reviewAnalytics,
      trainingAnalytics,
      peerRadiusAnalytics,

      benchmarks,

      analytics: {
        scores,
        rank: rankMetrics,
        top_cities: topCities,
        top_professions: topProfessions,
        gender_stats: genderStats,
        profession_stats: professionStats,
      },

      orderSummary,
      training: trainingSummary,
    };

  } catch (err) {
    console.error("Unexpected error in data service:", err);
    return null;
  }
};