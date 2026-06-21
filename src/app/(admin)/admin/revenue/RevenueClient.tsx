'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import {
  RevenueData,
  RevenueSummary,
  DailyRevenue,
  MonthlyRevenue,
  YearlyRevenue,
} from '@/lib/api/admin';

interface Props {
  initialData: RevenueData;
}

type TabKey = 'day' | 'month' | 'year';

// ─── Helpers ───────────────────────────────────────────────
function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString('vi-VN');
}

function formatVND(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr);
  return `Ngày ${d.getDate()} tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
}

function formatMonth(monthStr: string): string {
  const num = parseInt(monthStr.replace('T', ''));
  return `Tháng ${num}/${new Date().getFullYear()}`;
}

function formatYear(year: number): string {
  return `Năm ${year}`;
}

// ─── Summary Card ──────────────────────────────────────────
interface SummaryCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  accent?: 'default' | 'green' | 'blue' | 'orange';
}

function SummaryCard({ title, value, subValue, icon, accent = 'default' }: SummaryCardProps) {
  const accentStyles: Record<string, string> = {
    default: 'bg-zinc-50 border-zinc-100 text-zinc-700',
    green: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    orange: 'bg-amber-50 border-amber-100 text-amber-700',
  };

  return (
    <div className={`card-container border ${accentStyles[accent]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2">{title}</p>
          <p className="text-2xl font-black text-zinc-900 leading-none">{value}</p>
          {subValue && (
            <p className="text-xs font-semibold mt-1 text-zinc-400">{subValue}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shrink-0 shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Custom Tooltip ─────────────────────────────────────────
interface TooltipPayloadItem {
  value: number;
  name: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  formatter?: (value: number) => string;
}

function CustomTooltip({ active, payload, label, formatter = formatVND }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-xl px-4 py-3 min-w-[160px]">
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
            <span className="font-medium text-zinc-600">{entry.name === 'revenue' ? 'Doanh thu' : 'Đơn hàng'}</span>
          </div>
          <span className="font-bold text-zinc-900">{formatter(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Growth Badge ──────────────────────────────────────────
function GrowthBadge({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
      {isPositive ? '↑' : '↓'} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

// ─── Main Component ─────────────────────────────────────────
export function RevenueClient({ initialData }: Props) {
  const { summary, daily, monthly, yearly } = initialData;
  const [activeTab, setActiveTab] = useState<TabKey>('month');

  // ─── Chart Data ────────────────────────────────────────
  const dailyChartData = useMemo(() =>
    daily.map((d) => ({
      label: formatDate(d.date),
      labelFull: formatDateFull(d.date),
      revenue: d.revenue,
      orders: d.orders,
    })),
    [daily]
  );

  const monthlyChartData = useMemo(() =>
    monthly.map((m) => ({
      label: m.month,
      labelFull: `Tháng ${m.month.replace('T', '')} năm ${new Date().getFullYear()}`,
      revenue: m.revenue,
      orders: m.orders,
    })),
    [monthly]
  );

  const yearlyChartData = useMemo(() =>
    yearly.map((y) => ({
      label: String(y.year),
      labelFull: `Năm ${y.year}`,
      revenue: y.revenue,
      orders: y.orders,
    })),
    [yearly]
  );

  const tabData: Record<TabKey, { data: any[]; bars: any[]; height: number }> = {
    day: {
      data: dailyChartData,
      bars: [
        { dataKey: 'revenue', name: 'Doanh thu', fill: '#b61819', radius: [4, 4, 0, 0] },
        { dataKey: 'orders', name: 'Đơn hàng', fill: '#f59e0b', radius: [4, 4, 0, 0] },
      ],
      height: 320,
    },
    month: {
      data: monthlyChartData,
      bars: [
        { dataKey: 'revenue', name: 'Doanh thu', fill: '#b61819', radius: [4, 4, 0, 0] },
        { dataKey: 'orders', name: 'Đơn hàng', fill: '#f59e0b', radius: [4, 4, 0, 0] },
      ],
      height: 360,
    },
    year: {
      data: yearlyChartData,
      bars: [
        { dataKey: 'revenue', name: 'Doanh thu', fill: '#b61819', radius: [4, 4, 0, 0] },
        { dataKey: 'orders', name: 'Đơn hàng', fill: '#f59e0b', radius: [4, 4, 0, 0] },
      ],
      height: 360,
    },
  };

  const currentChart = tabData[activeTab];

  return (
    <div className="space-y-6">

      {/* ── Summary Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Hôm nay"
          value={formatVND(summary.revenueToday)}
          subValue={`${summary.ordersToday} đơn hàng`}
          icon={<span className="text-lg">📅</span>}
          accent="default"
        />
        <SummaryCard
          title="So với hôm qua"
          value={`${summary.growthToday >= 0 ? '+' : ''}${summary.growthToday.toFixed(1)}%`}
          subValue={summary.revenueYesterday > 0 ? formatVND(summary.revenueYesterday) : '—'}
          icon={<GrowthBadge value={summary.growthToday} />}
          accent={summary.growthToday >= 0 ? 'green' : 'orange'}
        />
        <SummaryCard
          title="Tháng này"
          value={formatVND(summary.revenueThisMonth)}
          subValue={`${summary.ordersThisMonth} đơn hàng`}
          icon={<span className="text-lg">📆</span>}
          accent="blue"
        />
        <SummaryCard
          title="Năm nay"
          value={formatVND(summary.revenueThisYear)}
          subValue={`${summary.ordersThisYear} đơn hàng · TB ${formatVND(summary.avgOrderValue)}/đơn`}
          icon={<span className="text-lg">📊</span>}
          accent="green"
        />
      </div>

      {/* ── Additional Stats Row ────────────────────────────── */}
      <div className="flex flex-wrap gap-4">
        <div className="card-container border border-zinc-100 px-5 py-3 flex items-center gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tổng doanh thu</p>
            <p className="text-base font-black text-zinc-900">{formatVND(summary.totalRevenue)}</p>
          </div>
        </div>
        <div className="card-container border border-zinc-100 px-5 py-3 flex items-center gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tổng đơn hàng</p>
            <p className="text-base font-black text-zinc-900">{summary.totalOrdersAllTime.toLocaleString('vi-VN')}</p>
          </div>
        </div>
        <div className="card-container border border-zinc-100 px-5 py-3 flex items-center gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Giá trị TB/đơn</p>
            <p className="text-base font-black text-zinc-900">{formatVND(summary.avgOrderValue)}</p>
          </div>
        </div>
      </div>

      {/* ── Chart Card ─────────────────────────────────────── */}
      <div className="card-container border border-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-black text-zinc-900 uppercase tracking-tight">
              Biểu đồ Doanh thu
            </h2>
            <p className="text-xs font-medium text-zinc-400 mt-0.5">
              {activeTab === 'day' ? '30 ngày gần nhất' : activeTab === 'month' ? '12 tháng trong năm' : '5 năm gần nhất'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 p-1 bg-zinc-50 rounded-xl border border-zinc-100 shrink-0">
            {[
              { key: 'day' as TabKey, label: 'Ngày' },
              { key: 'month' as TabKey, label: 'Tháng' },
              { key: 'year' as TabKey, label: 'Năm' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 px-6 py-3 border-b border-zinc-50">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#b61819]" />
            <span className="text-xs font-semibold text-zinc-500">Doanh thu (VND)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#f59e0b]" />
            <span className="text-xs font-semibold text-zinc-500">Số đơn hàng</span>
          </div>
        </div>

        {/* Chart */}
        <div className="px-4 pt-2 pb-6">
          <ResponsiveContainer width="100%" height={currentChart.height}>
            <BarChart
              data={currentChart.data}
              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              barCategoryGap="25%"
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fontWeight: '600', fill: '#a1a1aa' }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                tickFormatter={formatCurrency}
                tick={{ fontSize: 11, fontWeight: '500', fill: '#a1a1aa' }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fontWeight: '500', fill: '#a1a1aa' }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                content={<CustomTooltip formatter={formatVND} />}
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              />
              <Bar yAxisId="left" dataKey="revenue" name="revenue" fill="#b61819" radius={[4, 4, 0, 0]} maxBarSize={48} />
              <Bar yAxisId="right" dataKey="orders" name="orders" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom Stats: Top Kỳ + So sánh ─────────────────── */}
      {(() => {
        // Pick data + labels based on active tab
        const tabMeta: Record<TabKey, { label: string; prevLabel: string; title: string; getItem: (d: any) => { label: string; labelShort: string; revenue: number; orders: number } }> = {
          day: {
            label: 'ngày',
            prevLabel: 'so với ngày trước',
            title: 'Ngày',
            getItem: (d) => ({ label: d.labelFull, labelShort: d.label, revenue: d.revenue, orders: d.orders }),
          },
          month: {
            label: 'tháng',
            prevLabel: 'so với tháng trước',
            title: 'Tháng',
            getItem: (d) => ({ label: d.labelFull, labelShort: d.label, revenue: d.revenue, orders: d.orders }),
          },
          year: {
            label: 'năm',
            prevLabel: 'so với năm trước',
            title: 'Năm',
            getItem: (d) => ({ label: d.labelFull, labelShort: d.label, revenue: d.revenue, orders: d.orders }),
          },
        };

        const sourceData = tabData[activeTab].data;
        const meta = tabMeta[activeTab];
        const getItem = meta.getItem;

        // Top 5 by revenue
        const top5 = [...sourceData]
          .map(getItem)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
        const maxRevenue = top5[0]?.revenue || 1;

        // Period comparison: current vs previous
        const currentPeriod = sourceData[sourceData.length - 1];
        const prevPeriod = sourceData[sourceData.length - 2];
        const curItem = getItem(currentPeriod);
        const prevItem = prevPeriod ? getItem(prevPeriod) : null;

        const revenueChange = prevItem && prevItem.revenue > 0
          ? ((curItem.revenue - prevItem.revenue) / prevItem.revenue) * 100
          : null;
        const ordersChange = prevItem && prevItem.orders > 0
          ? ((curItem.orders - prevItem.orders) / prevItem.orders) * 100
          : null;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Top 5 kỳ có doanh thu cao nhất */}
            <div className="card-container border border-zinc-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
                    <span className="text-sm">🏆</span>
                    <h2 className="text-sm font-black text-zinc-900 uppercase tracking-tight">
                      Top 5 {meta.label} doanh thu cao nhất
                    </h2>
                  </div>
                  <div className="divide-y divide-zinc-50">
                    {top5.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50/60 transition-colors group" title={item.label}>
                        {/* Rank badge */}
                        <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                          idx === 0 ? 'bg-amber-400 text-white' :
                          idx === 1 ? 'bg-zinc-300 text-white' :
                          idx === 2 ? 'bg-amber-700 text-white' :
                          'bg-zinc-100 text-zinc-400'
                        }`}>
                          {idx + 1}
                        </span>
                        {/* Label */}
                        <span className="text-sm font-semibold text-zinc-700 w-16 shrink-0 truncate">{item.labelShort}</span>
                    {/* Revenue bar */}
                    <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden mx-2">
                      <div
                        className="h-full rounded-full bg-[#b61819] transition-all"
                        style={{ width: `${Math.max((item.revenue / maxRevenue) * 100, 2)}%` }}
                      />
                    </div>
                    {/* Revenue value */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-zinc-900">{formatVND(item.revenue)}</p>
                      <p className="text-[10px] text-zinc-400">{item.orders} đơn</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* So sánh kỳ gần nhất */}
            <div className="card-container border border-zinc-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
                <span className="text-sm">⚡</span>
                <h2 className="text-sm font-black text-zinc-900 uppercase tracking-tight">
                  {curItem.label} {meta.prevLabel}
                </h2>
              </div>
              <div className="p-5 space-y-4">
                {/* Revenue comparison */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Doanh thu</span>
                    {revenueChange !== null && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${revenueChange >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-3">
                    <span className="text-xl font-black text-zinc-900 leading-none">{formatVND(curItem.revenue)}</span>
                    {prevItem && (
                      <span className="text-xs text-zinc-400 mb-0.5">
                        vs {formatVND(prevItem.revenue)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Orders comparison */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Số đơn hàng</span>
                    {ordersChange !== null && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ordersChange >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {ordersChange >= 0 ? '+' : ''}{ordersChange.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-3">
                    <span className="text-xl font-black text-zinc-900 leading-none">{curItem.orders}</span>
                    {prevItem && (
                      <span className="text-xs text-zinc-400 mb-0.5">vs {prevItem.orders}</span>
                    )}
                  </div>
                </div>

                {/* Avg order value */}
                <div className="pt-2 border-t border-zinc-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Giá trị TB / đơn</span>
                    <span className="text-sm font-bold text-zinc-700">
                      {curItem.orders > 0 ? formatVND(curItem.revenue / curItem.orders) : '—'}
                    </span>
                  </div>
                </div>

                {/* Progress bar visual */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>{prevItem ? prevItem.label : '—'}</span>
                    <span>{curItem.label}</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden flex">
                    {prevItem && (
                      <div
                        className="bg-zinc-300 h-full transition-all"
                        style={{ width: `${Math.min((prevItem.revenue / Math.max(curItem.revenue, prevItem.revenue)) * 100, 100)}%` }}
                      />
                    )}
                    <div
                      className="bg-[#b61819] h-full transition-all"
                      style={{ width: `${Math.min((curItem.revenue / Math.max(curItem.revenue, prevItem?.revenue || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
