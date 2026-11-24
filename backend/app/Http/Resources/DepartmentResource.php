<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'description' => $this->description,
            'parent_id' => $this->parent_id,
            'manager_id' => $this->manager_id,
            'manager' => $this->manager ? [
                'id' => $this->manager->id,
                'name' => trim(($this->manager->first_name ?? '') . ' ' . ($this->manager->last_name ?? '')),
            ] : null,
            'employee_count' => $this->employees_count ?? 0,
            'is_active' => (bool) $this->is_active,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

