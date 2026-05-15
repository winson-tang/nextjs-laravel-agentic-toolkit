<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;

class AuditLogger
{
    public static function info(string $message, mixed $context = []): void
    {
        Log::info($message, ['ctx' => PhiRedactor::redactValue($context)]);
    }

    public static function warning(string $message, mixed $context = []): void
    {
        Log::warning($message, ['ctx' => PhiRedactor::redactValue($context)]);
    }

    public static function error(string $message, mixed $context = []): void
    {
        Log::error($message, ['ctx' => PhiRedactor::redactValue($context)]);
    }
}
