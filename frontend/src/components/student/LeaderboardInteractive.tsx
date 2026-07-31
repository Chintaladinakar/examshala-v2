'use client';

import React from 'react';
import { Trophy, Medal } from 'lucide-react';
import type { StudentLeaderboardData } from '@/lib/student/data';

const medalColor = (rank: number) => {
  if (rank === 1) return 'text-amber-500';
  if (rank === 2) return 'text-slate-400';
  if (rank === 3) return 'text-orange-600';
  return 'text-slate-300';
};

export function LeaderboardInteractive({ data }: { data: StudentLeaderboardData }) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-400">Performance</p>
        <h1 className="text-2xl font-bold text-slate-900">Leaderboard</h1>
        <p className="text-sm text-slate-500">Ranked by average exam score across your classes.</p>
      </div>

      {data.myRank && (
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-3xl p-6 text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <Trophy className="w-10 h-10 text-white/90" />
            <div>
              <p className="text-sm text-teal-50">Your Rank</p>
              <p className="text-2xl font-bold">#{data.myRank.rank}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-teal-50">Average Score</p>
            <p className="text-2xl font-bold">{data.myRank.averageScore}%</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h2 className="font-semibold text-slate-900">Top Performers</h2>
        </div>
        {data.rankings.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No ranked results yet. Rankings appear once exam results are published.
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {data.rankings.map((r) => (
              <div
                key={r.studentId}
                className={`p-4 px-6 flex items-center gap-4 ${r.studentId === data.myRank?.studentId ? 'bg-teal-50/50' : ''}`}
              >
                <div className="w-8 flex items-center justify-center shrink-0">
                  {r.rank <= 3 ? (
                    <Medal className={`w-5 h-5 ${medalColor(r.rank)}`} />
                  ) : (
                    <span className="text-sm font-semibold text-slate-400">#{r.rank}</span>
                  )}
                </div>
                <p className="flex-1 text-sm font-medium text-slate-900">{r.name}</p>
                <p className="text-sm font-bold text-slate-700">{r.averageScore}%</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
