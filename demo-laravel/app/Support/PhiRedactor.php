<?php

namespace App\Support;

class PhiRedactor
{
    private const PATTERNS = [
        'SSN'   => '/\b\d{3}-\d{2}-\d{4}\b/',
        'DOB'   => '/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/',
        'MRN'   => '/\b[A-Z]{2}-\d{6,}\b/',
        'EMAIL' => '/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/',
        'PHONE' => '/\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/',
    ];

    public static function redact(string $input): string
    {
        $result = $input;
        foreach (self::PATTERNS as $label => $pattern) {
            $result = preg_replace($pattern, "[REDACTED:{$label}]", $result);
        }
        return $result;
    }

    public static function redactValue(mixed $value): string
    {
        if ($value === null) {
            return '';
        }
        $encoded = is_string($value) ? $value : json_encode($value);
        return self::redact($encoded ?? '');
    }
}
