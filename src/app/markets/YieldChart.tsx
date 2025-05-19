'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartPoint } from '@/types/types';
import dayjs from 'dayjs';

export default function YieldChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis
          dataKey="ts"
          tickFormatter={(v) => dayjs(v).format('DD.MM')}
          axisLine={false}
          tickLine={false}
          stroke="#58697d"
        />
        <YAxis
          domain={[0, 'dataMax + 5']}
          axisLine={false}
          tickLine={false}
          stroke="#58697d"
        />
        <Tooltip
          contentStyle={{ background: '#111827', border: 'none' }}
          labelFormatter={(v) => dayjs(v).format('YYYY-MM-DD')}
        />
        <Line
          type="monotone"
          dataKey="apy"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
