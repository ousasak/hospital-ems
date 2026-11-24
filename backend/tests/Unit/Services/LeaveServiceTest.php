<?php

namespace Tests\Unit\Services;

use App\Models\Employee;
use App\Models\LeaveType;
use App\Services\Leave\LeaveService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_leave_service_submits_request_successfully(): void
    {
        $employee = Employee::first();
        $leaveType = LeaveType::first();

        $service = app(LeaveService::class);
        $request = $service->submitRequest([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'start_date' => Carbon::tomorrow()->toDateString(),
            'end_date' => Carbon::tomorrow()->addDays(2)->toDateString(),
            'total_days' => 2,
            'reason' => 'Annual family vacation',
        ]);

        $this->assertDatabaseHas('leave_requests', [
            'id' => $request->id,
            'employee_id' => $employee->id,
            'total_days' => 2,
            'status' => 'pending_supervisor',
        ]);
    }
}
