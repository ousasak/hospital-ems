<?php

namespace App\Services\Organization;

use App\Models\Department;
use App\Models\Position;
use App\Models\WorkLocation;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Schema;

class OrganizationService
{
    public function getDepartments(array $filters = []): Collection
    {
        $query = Department::with(['parent', 'manager', 'positions'])
            ->withCount(['positions', 'activeAssignments as employee_count']);

        if (!empty($filters['search'])) {
            $query->where('name', 'like', "%{$filters['search']}%")
                ->orWhere('code', 'like', "%{$filters['search']}%");
        }

        return $query->orderBy('name')->get();
    }

    public function getPositions(): Collection
    {
        return Position::with('department')->withCount('assignments')->get();
    }

    public function getWorkLocations(): Collection
    {
        if (!Schema::hasTable('work_locations')) {
            return new Collection();
        }
        return WorkLocation::all();
    }
}
