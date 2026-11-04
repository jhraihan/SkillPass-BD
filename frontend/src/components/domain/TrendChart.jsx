import { useId } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_COLORS } from '@/lib/constants';

function ChartTooltip({ active, payload, label, formatLabel, formatValue }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-semibold text-gray-900">{formatLabel(label)}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="flex items-center gap-2 text-gray-700">
          <span
            className="inline-block h-0.5 w-3 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          {item.name}:{' '}
          <span className="font-semibold text-gray-900">{formatValue(item.value)}</span>
        </p>
      ))}
    </div>
  );
}

export default function TrendChart({
  data,
  xKey,
  series,
  height = 280,
  formatX = (value) => value,
  formatLabel = formatX,
  formatValue = (value) => value,
  label,
}) {
  const titleId = useId();

  return (
    <figure aria-labelledby={label ? titleId : undefined} className="w-full">
      {label && (
        <figcaption id={titleId} className="sr-only">
          {label}
        </figcaption>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey={xKey}
            tickFormatter={formatX}
            stroke={CHART_COLORS.axis}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tickFormatter={formatValue}
            stroke={CHART_COLORS.axis}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            cursor={{ stroke: CHART_COLORS.axis, strokeDasharray: '3 3' }}
            content={<ChartTooltip formatLabel={formatLabel} formatValue={formatValue} />}
          />
          <Legend iconType="plainline" wrapperStyle={{ fontSize: 13, color: '#374151' }} />
          {series.map((item) => (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.label}
              stroke={item.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
}
