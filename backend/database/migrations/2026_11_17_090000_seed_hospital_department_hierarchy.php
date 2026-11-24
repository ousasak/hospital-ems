<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Models\Department;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::transaction(function () {
            $hierarchy = [
                // Level 2: Divisions reporting to DIR (Hospital Executive Directorate)
                'ADMIN'    => 'DIR',
                'EMERG'    => 'DIR',
                'SURG'     => 'DIR',
                'GENMED'   => 'DIR',

                // Level 3: Under ADMIN (Administration & Operations)
                'PHYS'     => 'ADMIN',
                'PHARM'    => 'ADMIN',

                // Level 3: Under EMERG (Emergency & Acute Care)
                'ICU'      => 'EMERG',
                'LAB'      => 'EMERG',
                'IMAGE'    => 'EMERG',

                // Level 3: Under SURG (Surgical Division)
                'OPANESTH' => 'SURG',
                'OBGYN'    => 'SURG',
                'ENDO'     => 'SURG',
                'DENT'     => 'SURG',

                // Level 3: Under GENMED (General & Internal Medicine)
                'OPD'      => 'GENMED',
                'PED'      => 'GENMED',
                'INFECT'   => 'GENMED',
                'ENT'      => 'GENMED',
                'OPHTHAL'  => 'GENMED',
                'PSYCH'    => 'GENMED',

                // Level 4: Under LAB (Diagnostic Laboratory)
                'BLOOD'    => 'LAB',
            ];

            $departments = Department::all()->keyBy('code');

            // Ensure Level 1 Root has parent_id = null
            if (isset($departments['DIR'])) {
                $departments['DIR']->update(['parent_id' => null]);
            }

            foreach ($hierarchy as $code => $parentCode) {
                if (isset($departments[$code]) && isset($departments[$parentCode])) {
                    $departments[$code]->update([
                        'parent_id' => $departments[$parentCode]->id
                    ]);
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::transaction(function () {
            Department::query()->update(['parent_id' => null]);
        });
    }
};
