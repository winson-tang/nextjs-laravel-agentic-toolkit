<?php

use App\Support\PhiRedactor;

it('redacts SSN pattern', function () {
    expect(PhiRedactor::redact('Patient SSN is 123-45-6789'))
        ->toBe('Patient SSN is [REDACTED:SSN]');
});

it('redacts DOB pattern', function () {
    expect(PhiRedactor::redact('DOB: 3/15/1980'))
        ->toBe('DOB: [REDACTED:DOB]');
});

it('redacts MRN pattern', function () {
    expect(PhiRedactor::redact('MRN AB-123456 on file'))
        ->toBe('MRN [REDACTED:MRN] on file');
});

it('redacts email address', function () {
    expect(PhiRedactor::redact('Contact patient@example.com for follow-up'))
        ->toBe('Contact [REDACTED:EMAIL] for follow-up');
});

it('redacts phone number', function () {
    expect(PhiRedactor::redact('Call 555-867-5309 to confirm'))
        ->toBe('Call [REDACTED:PHONE] to confirm');
});

it('leaves non-PHI strings unchanged', function () {
    expect(PhiRedactor::redact('Appointment confirmed for next Tuesday'))
        ->toBe('Appointment confirmed for next Tuesday');
});

it('redactValue handles array input', function () {
    $result = PhiRedactor::redactValue(['email' => 'patient@example.com', 'note' => 'see you then']);
    expect($result)->toContain('[REDACTED:EMAIL]')
        ->and($result)->toContain('see you then');
});

it('redactValue handles null', function () {
    expect(PhiRedactor::redactValue(null))->toBe('');
});
