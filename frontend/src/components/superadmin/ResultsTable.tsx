"use client";

import React, { useState, useMemo } from 'react';
import { SearchBar } from './SearchBar';
import { FilterDropdown } from './FilterDropdown';
import { Table } from './Table';
import { TableRow, TableCell } from './TableRow';
import { CheckCircle, TrendingUp, Award, Calendar, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Result {
  id: string;
  studentName: string;
  examTitle: string;
  workspaceName: string;
  score: number;
  maxScore: number;
  status: string;
  evaluatedAt: string;
}

interface ResultsTableProps {
  initialResults: Result[];
}

export function ResultsTable({ initialResults }: ResultsTableProps) {
  const [results, setResults] = useState<Result[]>(initialResults);
  const [searchTerm, setSearchTerm] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState('all');

  const workspaceOptions = useMemo(() => {
    const workspaces = Array.from(new Set(results.map(r => r.workspaceName)));
    return [
      { label: 'All Workspaces', value: 'all' },
      ...workspaces.map(w => ({ label: w, value: w }))
    ];
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchesSearch = r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.examTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesWorkspace = workspaceFilter === 'all' || r.workspaceName === workspaceFilter;
      return matchesSearch && matchesWorkspace;
    });
  }, [results, searchTerm, workspaceFilter]);

  const headers = ["Student Name", "Exam & Workspace", "Score", "Status", "Date"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <SearchBar 
          value={searchTerm} 
          onChange={setSearchTerm} 
          placeholder="Search student or exam..." 
        />
        <FilterDropdown 
          label="Filter by Workspace" 
          options={workspaceOptions} 
          value={workspaceFilter} 
          onChange={setWorkspaceFilter} 
          icon={Building2}
        />
      </div>

      <Table headers={headers}>
        {filteredResults.map((result) => {
          const percentage = ((result.score / result.maxScore) * 100).toFixed(1);
          const isHighScorer = Number(percentage) >= 90;
          const isLowScorer = Number(percentage) < 50;

          return (
            <TableRow key={result.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center font-bold text-xs">
                    {result.studentName.charAt(0)}
                  </div>
                  <span className="font-bold text-slate-900">{result.studentName}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">{result.examTitle}</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    <Building2 className="w-3 h-3" />
                    {result.workspaceName}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="flex items-baseline gap-0.5">
                    <span className={cn(
                      "text-base font-black",
                      isHighScorer ? "text-emerald-600" : isLowScorer ? "text-rose-600" : "text-slate-900"
                    )}>
                      {result.score}
                    </span>
                    <span className="text-slate-400 text-[10px] font-bold">/{result.maxScore}</span>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded-lg text-[10px] font-black",
                    isHighScorer ? "bg-emerald-50 text-emerald-700" : isLowScorer ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-500"
                  )}>
                    {percentage}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  result.status === 'evaluated' 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                    : "bg-amber-50 text-amber-700 border border-amber-100"
                )}>
                  {result.status === 'evaluated' ? <CheckCircle className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {result.status}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-tight">
                  <Calendar className="w-3.5 h-3.5 text-slate-300" />
                  {new Date(result.evaluatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </Table>

      {filteredResults.length === 0 && (
        <div className="p-20 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
           <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
             <Award className="w-8 h-8 text-slate-300" />
           </div>
           <h3 className="text-lg font-bold text-slate-900">No results found</h3>
           <p className="text-slate-500 max-w-xs mx-auto text-sm mt-1">Try adjusting your filters or search term.</p>
        </div>
      )}
    </div>
  );
}
