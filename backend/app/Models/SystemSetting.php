<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'key',
        'value',
        'group',
        'description',
        'is_public',
        'updated_by',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    public static function set(string $key, mixed $value, string $group = 'general', ?string $description = null, ?int $organizationId = null, ?int $updatedBy = null): static
    {
        $attributes = [
            'value' => (string) $value,
            'group' => $group,
            'description' => $description,
        ];

        if ($organizationId !== null) {
            $attributes['organization_id'] = $organizationId;
        }

        if ($updatedBy !== null) {
            $attributes['updated_by'] = $updatedBy;
        }

        return static::updateOrCreate(
            ['key' => $key],
            $attributes
        );
    }
}
