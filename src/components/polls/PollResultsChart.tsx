"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PollResultsChartProps {
  options: {
    id: string;
    text: string;
    _count: { votes: number };
  }[];
}

export function PollResultsChart({ options }: PollResultsChartProps) {
  // Map options to the structure Recharts expects
  const data = options.map(option => ({
    name: option.text,
    votes: option._count.votes,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="votes" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}