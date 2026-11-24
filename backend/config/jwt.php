<?php

return [
    /*
    |--------------------------------------------------------------------------
    | JWT Authentication Secret
    |--------------------------------------------------------------------------
    |
    | Secret key used for signing JSON Web Tokens with HMAC-SHA256.
    | Reads from JWT_SECRET in .env, falling back securely to APP_KEY.
    |
    */
    'secret' => env('JWT_SECRET', env('APP_KEY')),

    /*
    |--------------------------------------------------------------------------
    | JWT Token Time To Live (TTL)
    |--------------------------------------------------------------------------
    |
    | Duration in seconds that the access token remains valid.
    | Default: 3600 seconds (1 hour).
    |
    */
    'ttl' => (int) env('JWT_TTL', 3600),

    /*
    |--------------------------------------------------------------------------
    | JWT Signing Algorithm
    |--------------------------------------------------------------------------
    */
    'algo' => 'HS256',
];

