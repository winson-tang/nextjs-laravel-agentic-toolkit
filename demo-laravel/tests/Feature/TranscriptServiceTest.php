<?php

use App\Models\Transcript;
use App\Services\TranscriptService;
use App\Services\VendorServiceInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// Subclass that skips real sleep so retry tests run fast
class TestTranscriptService extends TranscriptService
{
    protected function sleep(int $microseconds): void {}
}

function makeService(VendorServiceInterface $vendor): TranscriptService
{
    return new TestTranscriptService($vendor);
}

it('uploads audio and returns a ready transcript on success', function () {
    $vendor = Mockery::mock(VendorServiceInterface::class);
    $vendor->shouldReceive('transcribe')->once()->andReturn('Patient presents with hearing loss.');

    $service = makeService($vendor);
    $transcript = $service->upload('tenant-1', 'patient-1', 'key-abc', '/audio/file.wav');

    expect($transcript->status)->toBe('ready')
        ->and($transcript->text)->toBe('Patient presents with hearing loss.');
});

it('returns the existing transcript when the idempotency key is reused', function () {
    $vendor = Mockery::mock(VendorServiceInterface::class);
    $vendor->shouldReceive('transcribe')->once()->andReturn('Original transcript.');

    $service = makeService($vendor);
    $first  = $service->upload('tenant-1', 'patient-1', 'key-idem', '/audio/a.wav');
    $second = $service->upload('tenant-1', 'patient-1', 'key-idem', '/audio/a.wav');

    expect($second->id)->toBe($first->id);
    expect(Transcript::count())->toBe(1);
});

it('retries the vendor and succeeds on the third attempt', function () {
    $callCount = 0;
    $vendor = Mockery::mock(VendorServiceInterface::class);
    $vendor->shouldReceive('transcribe')
        ->times(3)
        ->andReturnUsing(function () use (&$callCount) {
            $callCount++;
            if ($callCount < 3) {
                throw new \RuntimeException('vendor error');
            }
            return 'Transcript after retry.';
        });

    $service = makeService($vendor);
    $transcript = $service->upload('tenant-1', 'patient-1', 'key-retry', '/audio/b.wav');

    expect($transcript->status)->toBe('ready')
        ->and($transcript->text)->toBe('Transcript after retry.');
});

it('marks the transcript unavailable when the vendor exhausts all attempts', function () {
    $vendor = Mockery::mock(VendorServiceInterface::class);
    $vendor->shouldReceive('transcribe')
        ->times(3)
        ->andThrow(new \RuntimeException('vendor down'));

    $service = makeService($vendor);
    $transcript = $service->upload('tenant-1', 'patient-1', 'key-fail', '/audio/c.wav');

    expect($transcript->status)->toBe('unavailable')
        ->and($transcript->text)->toBeNull();
});

it('does not return a transcript to a different tenant', function () {
    $vendor = Mockery::mock(VendorServiceInterface::class);
    $vendor->shouldReceive('transcribe')->once()->andReturn('Private note.');

    $service = makeService($vendor);
    $transcript = $service->upload('tenant-A', 'patient-1', 'key-cross', '/audio/d.wav');

    $result = $service->getById('tenant-B', $transcript->id);

    expect($result)->toBeNull();
});
