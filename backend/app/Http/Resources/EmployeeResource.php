<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $primary = $this->primaryAssignment;

        return [
            'id' => $this->id,
            'employee_code' => $this->employee_code,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'name' => trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? '')),
            'email' => $this->email,
            'phone' => $this->phone,
            'gender' => $this->gender,
            'dob' => $this->dob?->toDateString(),
            'join_date' => $this->join_date?->toDateString(),
            'employment_status' => $this->employment_status,
            'avatar_url' => $this->avatar_url,
            'department' => $primary?->department ? [
                'id' => $primary->department->id,
                'name' => $primary->department->name,
            ] : null,
            'position' => $primary?->position ? [
                'id' => $primary->position->id,
                'title' => $primary->position->title,
            ] : null,
            'work_location' => $primary?->workLocation ? [
                'id' => $primary->workLocation->id,
                'name' => $primary->workLocation->name,
                'city' => $primary->workLocation->city,
                'country' => $primary->workLocation->country,
            ] : null,
            'employment_type' => $primary?->employmentType ? [
                'id' => $primary->employmentType->id,
                'name' => $primary->employmentType->name,
            ] : null,
            'supervisor' => $primary?->supervisor ? [
                'id' => $primary->supervisor->id,
                'name' => trim(($primary->supervisor->first_name ?? '') . ' ' . ($primary->supervisor->last_name ?? '')),
            ] : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

