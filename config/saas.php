<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Plan
    |--------------------------------------------------------------------------
    |
    | The plan (by slug) a newly registered organization is placed on. The
    | organization starts in "trial" status for the plan's trial_days, or
    | for `trial_days` below when the plan does not define one.
    |
    */

    'default_plan' => env('SAAS_DEFAULT_PLAN', 'starter'),

    'trial_days' => (int) env('SAAS_TRIAL_DAYS', 14),

];
