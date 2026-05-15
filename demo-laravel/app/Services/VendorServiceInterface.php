<?php

namespace App\Services;

interface VendorServiceInterface
{
    public function transcribe(string $audioPath): string;
}
