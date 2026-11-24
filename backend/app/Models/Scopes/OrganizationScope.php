<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class OrganizationScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        // Multi-tenant or organization-level scoping if active organization session exists
        if (session()->has('active_organization_id')) {
            $builder->where('organization_id', session()->get('active_organization_id'));
        }
    }
}
