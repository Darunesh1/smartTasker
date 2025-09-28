'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Priority, Category } from '@/types/task';

type FilterStatus = 'all' | 'past-due' | 'due-today' | 'due-this-week' | 'upcoming' | 'completed';
const priorities: (Priority | 'all')[] = ['all', 'Critical', 'High', 'Medium', 'Low', 'Very Low'];
const categories: (Category | 'all')[] = ['all', 'Work', 'Personal', 'Health', 'Study'];

interface FilterControlsProps {
    filterStatus: FilterStatus;
    setFilterStatus: (status: FilterStatus) => void;
    filterPriority: Priority | 'all';
    setFilterPriority: (priority: Priority | 'all') => void;
    filterCategory: Category | 'all';
    setFilterCategory: (category: Category | 'all') => void;
}

export default function FilterControls({ 
    filterStatus, 
    setFilterStatus, 
    filterPriority, 
    setFilterPriority,
    filterCategory,
    setFilterCategory,
}: FilterControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
        <SelectTrigger className="w-full sm:w-auto">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="past-due">Past Due</SelectItem>
          <SelectItem value="due-today">Due Today</SelectItem>
          <SelectItem value="due-this-week">Due This Week</SelectItem>
          <SelectItem value="upcoming">Upcoming</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as Priority | 'all')}>
        <SelectTrigger className="w-full sm:w-auto">
          <SelectValue placeholder="Filter by priority" />
        </SelectTrigger>
        <SelectContent>
            {priorities.map(p => (
                <SelectItem key={p} value={p}>
                    {p === 'all' ? 'All Priorities' : p}
                </SelectItem>
            ))}
        </SelectContent>
      </Select>

      <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value as Category | 'all')}>
        <SelectTrigger className="w-full sm:w-auto">
          <SelectValue placeholder="Filter by category" />
        </SelectTrigger>
        <SelectContent>
            {categories.map(c => (
                <SelectItem key={c} value={c}>
                    {c === 'all' ? 'All Categories' : c}
                </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
