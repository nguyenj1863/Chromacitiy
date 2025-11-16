"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CaloriePoint {
  sessionId: string;
  eventTime: string;
  caloriesTotal: number;
}

interface TimelinePoint {
  time: string;
  calories: number;
  burst: number;
  trend?: number;
}

interface SessionTotalPoint {
  session: string;
  total: number;
  duration: number;
}

interface CalorieTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TimelinePoint }>;
  label?: string | number;
}

const SAMPLE_CALORIE_DATA: CaloriePoint[] = [
  { sessionId: "sample", eventTime: new Date("2025-02-14T10:00:00Z").toISOString(), caloriesTotal: 5 },
  { sessionId: "sample", eventTime: new Date("2025-02-14T10:05:00Z").toISOString(), caloriesTotal: 9 },
  { sessionId: "sample", eventTime: new Date("2025-02-14T10:10:00Z").toISOString(), caloriesTotal: 15 },
  { sessionId: "sample", eventTime: new Date("2025-02-14T10:15:00Z").toISOString(), caloriesTotal: 21 },
  { sessionId: "sample", eventTime: new Date("2025-02-14T10:20:00Z").toISOString(), caloriesTotal: 28 },
];

export default function AnalyticsModal({ isOpen, onClose }: AnalyticsModalProps) {
  const [calorieData, setCalorieData] = useState<CaloriePoint[]>(SAMPLE_CALORIE_DATA);
  const [usingSampleData, setUsingSampleData] = useState(true);
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchCalorieData();
  }, [isOpen]);

  const fetchCalorieData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/calories");
      const data = await response.json();
      if (response.ok) {
        const rows: CaloriePoint[] = (data.data ?? []).reverse();
        if (rows.length > 0) {
          setCalorieData(rows);
          setUsingSampleData(false);
        } else {
          setCalorieData(SAMPLE_CALORIE_DATA);
          setUsingSampleData(true);
        }
      } else {
        setError(data.error || "Failed to load calorie data.");
        setCalorieData(SAMPLE_CALORIE_DATA);
        setUsingSampleData(true);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load calorie data.");
      setCalorieData(SAMPLE_CALORIE_DATA);
      setUsingSampleData(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInsights = async () => {
    setInsightsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/analytics");
      const data = await response.json();
      if (response.ok) {
        setInsights(data.insights ?? []);
      } else {
        setInsights([
          "Sample insight: longer play sessions steadily increased your calorie burn.",
          "Tip: keep a consistent jump rhythm to maintain optimal intensity.",
        ]);
        setError(data.error || "Failed to load Snowflake insights; showing sample data.");
      }
    } catch (err) {
      console.error(err);
      setInsights([
        "Sample insight: longer play sessions steadily increased your calorie burn.",
        "Tip: keep a consistent jump rhythm to maintain optimal intensity.",
      ]);
      setError("Failed to load insights; showing sample data.");
    } finally {
      setInsightsLoading(false);
    }
  };

  if (!isOpen) return null;

  const timelineSeries: TimelinePoint[] =
    calorieData.length > 0
      ? calorieData.map((point, index) => {
          const previousTotal = index > 0 ? calorieData[index - 1].caloriesTotal : 0;
          const delta = point.caloriesTotal - previousTotal;
          return {
            time: new Date(point.eventTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            calories: Number(point.caloriesTotal.toFixed(2)),
            burst: Number(Math.max(delta, 0).toFixed(2)),
          };
        })
      : [
          { time: "10:00", calories: 12, burst: 12 },
          { time: "10:05", calories: 18, burst: 6 },
          { time: "10:10", calories: 24, burst: 6 },
          { time: "10:15", calories: 31, burst: 7 },
          { time: "10:20", calories: 40, burst: 9 },
        ];

  timelineSeries.forEach((point, index) => {
    if (index === 0) {
      point.trend = point.calories;
    } else {
      const prevTrend = timelineSeries[index - 1].trend ?? timelineSeries[index - 1].calories;
      point.trend = Number((prevTrend + (point.calories - prevTrend) * 0.35).toFixed(2));
    }
  });

  const totalCalories = timelineSeries[timelineSeries.length - 1]?.calories ?? 0;
  const peakBurst = timelineSeries.reduce((max, point) => Math.max(max, point.burst ?? 0), 0);
  const totalSessions = Math.max(new Set(calorieData.map((c) => c.sessionId)).size, 1);
  const lastEntryTime = timelineSeries[timelineSeries.length - 1]?.time ?? "--:--";

  const firstTimestamp = calorieData.length > 0 ? new Date(calorieData[0].eventTime).getTime() : null;
  const lastTimestamp =
    calorieData.length > 0 ? new Date(calorieData[calorieData.length - 1].eventTime).getTime() : null;
  const totalMinutes =
    firstTimestamp && lastTimestamp ? Math.max((lastTimestamp - firstTimestamp) / 60000, 0.1) : timelineSeries.length * 0.25;
  const avgBurnRate = totalMinutes > 0 ? totalCalories / totalMinutes : 0;

  const sessionStats = calorieData.reduce(
    (map, point) => {
      const timestamp = new Date(point.eventTime).getTime();
      const existing = map.get(point.sessionId) ?? { total: 0, start: timestamp, end: timestamp };
      existing.total = Math.max(existing.total, point.caloriesTotal);
      existing.start = Math.min(existing.start, timestamp);
      existing.end = Math.max(existing.end, timestamp);
      map.set(point.sessionId, existing);
      return map;
    },
    new Map<string, { total: number; start: number; end: number }>()
  );

  const sessionTotalsData: SessionTotalPoint[] =
    sessionStats.size > 0
      ? Array.from(sessionStats.entries()).map(([sessionId, stats]) => ({
          session: sessionId.length > 8 ? `${sessionId.slice(0, 3)}…${sessionId.slice(-3)}` : sessionId,
          total: Number(stats.total.toFixed(1)),
          duration: Number(Math.max((stats.end - stats.start) / 60000, 0.5).toFixed(1)),
        }))
      : [
          { session: "S-1", total: 32, duration: 18 },
          { session: "S-2", total: 47, duration: 22 },
          { session: "S-3", total: 29, duration: 15 },
        ];

  const avgSessionDuration =
    sessionTotalsData.length > 0
      ? sessionTotalsData.reduce((sum, entry) => sum + entry.duration, 0) / sessionTotalsData.length
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur" onClick={onClose} />
      <div className="relative max-w-5xl w-full max-h-[90vh] overflow-y-auto glass-panel border border-white/20 p-6 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl text-white tracking-[0.2em]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              ANALYTICS
            </h2>
            <p className="text-xs text-gray-300 mt-1" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              {usingSampleData ? "Showing live demo data — connect Snowflake for personal stats." : "Synced from Snowflake in real time."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="pixel-button-glass px-3 py-1 text-[11px] self-start md:self-auto"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            CLOSE
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SummaryCard label="TOTAL KCAL" value={totalCalories.toFixed(1)} sublabel="Latest session tally" />
          <SummaryCard label="AVG KCAL / MIN" value={avgBurnRate.toFixed(1)} sublabel="Rolling burn rate" />
          <SummaryCard label="PEAK BURST" value={peakBurst.toFixed(1)} sublabel="Max spike detected" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartPanel
            title="CALORIE TIMELINE"
            subtitle="Cumulative burn with burst energy pulses"
            actionSlot={
              <button onClick={fetchCalorieData} className="pixel-button-glass px-2 py-1 text-[10px]">
                REFRESH
              </button>
            }
          >
            {isLoading && <p className="text-gray-400 text-xs">Fetching Snowflake data...</p>}
            <div className="w-full h-64">
              <ResponsiveContainer>
                <ComposedChart data={timelineSeries} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="calorieGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#f472b6" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="time" tick={{ fill: "#fff", fontSize: 10 }} />
                  <YAxis
                    yAxisId="kcal"
                    tick={{ fill: "#fff", fontSize: 10 }}
                    allowDecimals={false}
                    domain={["auto", "auto"]}
                  />
                  <YAxis yAxisId="burst" orientation="right" hide />
                  <Tooltip content={<CalorieTooltip />} />
                  <Bar yAxisId="burst" dataKey="burst" barSize={6} fill="#22d3ee" radius={[4, 4, 0, 0]} opacity={0.65} />
                  <Area
                    yAxisId="kcal"
                    type="monotone"
                    dataKey="calories"
                    stroke="#f472b6"
                    strokeWidth={2.5}
                    fill="url(#calorieGradient)"
                  />
                  <Line yAxisId="kcal" type="monotone" dataKey="trend" stroke="#fde047" strokeWidth={1.5} dot={false} />
                  <ReferenceLine
                    yAxisId="kcal"
                    y={totalCalories * 0.5}
                    stroke="#fde047"
                    strokeDasharray="4 4"
                    ifOverflow="extendDomain"
                    label={{
                      value: "50% GOAL",
                      position: "insideTopRight",
                      fill: "#fde047",
                      fontSize: 9,
                      fontFamily: "'Press Start 2P', monospace",
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] text-gray-200" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              <LegendDot color="#f472b6" label="TOTAL KCAL" />
              <LegendDot color="#22d3ee" label="BURST" />
              <LegendDot color="#fde047" label="TREND" />
              <span className="uppercase tracking-[0.25em]">{`Sessions: ${totalSessions}`}</span>
            </div>
          </ChartPanel>

          <ChartPanel title="SESSION IMPACT" subtitle="How each run contributed to calories + duration">
            <div className="w-full h-64">
              <ResponsiveContainer>
                <BarChart data={sessionTotalsData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="session" tick={{ fill: "#fff", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#fff", fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #475569", color: "#fff" }} />
                  <Bar dataKey="total" fill="#a855f7" radius={[8, 8, 0, 0]}>
                    <LabelList
                      dataKey="total"
                      position="top"
                      content={(props: any) => {
                        const { x, y, value } = props;
                        if (value == null) return null;
                        return (
                          <text
                            x={x}
                            y={(y ?? 0) - 6}
                            textAnchor="middle"
                            fill="#fff"
                            style={{ fontSize: 10, fontFamily: "'Press Start 2P', monospace" }}
                          >
                            {`${value} kcal`}
                          </text>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-gray-300" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              Avg session length: {avgSessionDuration.toFixed(1)} min · Top run:{" "}
              {Math.max(...sessionTotalsData.map((entry) => entry.total)).toFixed(1)} kcal
            </p>
          </ChartPanel>
        </div>

        <ChartPanel
          title="AI INSIGHTS (GEMINI)"
          subtitle="Narrative breakdown of your energy story"
          actionSlot={
            <button
              onClick={fetchInsights}
              className="pixel-button-glass px-2 py-1 text-[10px]"
              disabled={insightsLoading}
            >
              {insightsLoading ? "LOADING..." : "GENERATE"}
            </button>
          }
        >
          {insights.length === 0 ? (
            <p className="text-gray-300 text-sm">
              {insightsLoading
                ? "Generating insights..."
                : "No data synced yet. Try generating after a sample session."}
            </p>
          ) : (
            <ul className="space-y-2 text-sm text-gray-100">
              {insights.map((insight, index) => (
                <li key={index} className="leading-relaxed">
                  {insight}
                </li>
              ))}
            </ul>
          )}
        </ChartPanel>

        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sublabel }: { label: string; value: string; sublabel: string }) {
  return (
    <div className="bg-white/5 border border-white/15 rounded-lg p-4 shadow-lg flex flex-col gap-2">
      <span className="text-[10px] tracking-[0.35em] text-gray-400" style={{ fontFamily: "'Press Start 2P', monospace" }}>
        {label}
      </span>
      <span className="text-3xl text-white" style={{ fontFamily: "'Press Start 2P', monospace" }}>
        {value}
      </span>
      <span className="text-[10px] text-gray-400" style={{ fontFamily: "'Press Start 2P', monospace" }}>
        {sublabel}
      </span>
    </div>
  );
}

function ChartPanel({
  title,
  subtitle,
  children,
  actionSlot,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actionSlot?: ReactNode;
}) {
  return (
    <div className="bg-white/5 border border-white/20 rounded-xl p-4 shadow-xl space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-fuchsia-200 tracking-[0.4em]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
            {title}
          </p>
          {subtitle && (
            <p className="text-[11px] text-gray-300 mt-1" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              {subtitle}
            </p>
          )}
        </div>
        {actionSlot}
      </div>
      {children}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </span>
  );
}

function CalorieTooltip({ active, payload, label }: CalorieTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const dataPoint = payload[0]?.payload as TimelinePoint | undefined;
  if (!dataPoint) return null;

  return (
    <div
      className="rounded-lg border border-white/20 bg-black/80 px-3 py-2 text-[10px] text-white"
      style={{ fontFamily: "'Press Start 2P', monospace" }}
    >
      <p className="text-xs mb-1 text-gray-200">{label}</p>
      <p className="text-emerald-300">Total: {dataPoint.calories.toFixed(1)} kcal</p>
      <p className="text-sky-300">Burst: +{dataPoint.burst.toFixed(1)} kcal</p>
      {dataPoint.trend != null && <p className="text-amber-200">Trend: {dataPoint.trend.toFixed(1)} kcal</p>}
    </div>
  );
}

