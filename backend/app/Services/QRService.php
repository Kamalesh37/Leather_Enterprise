<?php

namespace App\Services;

class QRService
{
    public function generateDeterministicHash(string $serialNumber, string $modelName): string
    {
        $normalizedSerial = strtoupper(trim($serialNumber));
        $normalizedModel = strtoupper(trim($modelName));
        $payload = "SEED_PROD:{$normalizedSerial}:{$normalizedModel}";

        return hash('sha256', $payload);
    }
}
