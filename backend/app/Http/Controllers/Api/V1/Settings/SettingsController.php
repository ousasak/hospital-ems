<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class SettingsController extends Controller
{
    public function getSettings(): JsonResponse
    {
        $settings = SystemSetting::all()->pluck('value', 'key');
        return response()->json($settings);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $settings = $request->all();

        foreach ($settings as $key => $value) {
            SystemSetting::updateOrCreate(
                ['key' => $key],
                ['value' => is_bool($value) ? ($value ? 'true' : 'false') : (string) $value]
            );
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }

    // Announcements
    public function announcements(): JsonResponse
    {
        $announcements = Announcement::with('author')
            ->orderBy('published_at', 'desc')
            ->get();

        return response()->json($announcements);
    }

    public function storeAnnouncement(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'priority' => 'required|string|in:normal,high,urgent',
            'target_audience' => 'required|string|in:all,department',
            'target_department_id' => 'nullable|exists:departments,id',
            'expires_at' => 'nullable|date',
        ]);

        $announcement = Announcement::create(array_merge($validated, [
            'author_id' => $request->user()->id,
            'is_published' => true,
            'published_at' => now(),
        ]));

        return response()->json(['message' => 'Announcement published successfully', 'announcement' => $announcement], 201);
    }

    public function destroyAnnouncement($id): JsonResponse
    {
        $ann = Announcement::findOrFail($id);
        $ann->delete();

        return response()->json(['message' => 'Announcement deleted successfully']);
    }

    // Audit logs
    public function auditLogs(Request $request): JsonResponse
    {
        $logs = Activity::with('causer')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 25));

        return response()->json($logs);
    }
}

