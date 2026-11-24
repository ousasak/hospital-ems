<?php

namespace App\Services\QrCode;

/**
 * Enterprise Production-Ready Standalone QR Code Generator
 *
 * Implements ISO/IEC 18004 standard QR Code generation:
 * - Supports Byte encoding mode
 * - Dynamically supports Versions 1 to 10
 * - Reed-Solomon Error Correction (Levels L, M, Q, H)
 * - Standard Finder, Alignment, Timing patterns & Masks
 * - Outputs Vector SVG & Base64 PNG via PHP GD extension
 * - Zero external network dependency, 100% offline & reproducible
 */
class QrCodeService
{
    // Error correction levels
    public const ECC_L = 1; // ~7% recovery
    public const ECC_M = 0; // ~15% recovery
    public const ECC_Q = 3; // ~25% recovery
    public const ECC_H = 2; // ~30% recovery

    /**
     * Capacity table: [version][eccLevel] => total capacity in data bytes (8-bit byte mode)
     */
    private static array $capacityTable = [
        1  => [self::ECC_L => 17,  self::ECC_M => 14,  self::ECC_Q => 11,  self::ECC_H => 7],
        2  => [self::ECC_L => 32,  self::ECC_M => 26,  self::ECC_Q => 20,  self::ECC_H => 14],
        3  => [self::ECC_L => 53,  self::ECC_M => 42,  self::ECC_Q => 32,  self::ECC_H => 24],
        4  => [self::ECC_L => 78,  self::ECC_M => 62,  self::ECC_Q => 46,  self::ECC_H => 34],
        5  => [self::ECC_L => 106, self::ECC_M => 84,  self::ECC_Q => 60,  self::ECC_H => 44],
        6  => [self::ECC_L => 134, self::ECC_M => 106, self::ECC_Q => 74,  self::ECC_H => 58],
        7  => [self::ECC_L => 154, self::ECC_M => 122, self::ECC_Q => 86,  self::ECC_H => 64],
        8  => [self::ECC_L => 192, self::ECC_M => 152, self::ECC_Q => 108, self::ECC_H => 84],
        9  => [self::ECC_L => 230, self::ECC_M => 180, self::ECC_Q => 130, self::ECC_H => 98],
        10 => [self::ECC_L => 271, self::ECC_M => 213, self::ECC_Q => 151, self::ECC_H => 119],
    ];

    /**
     * Total data codewords per version and ecc level
     */
    private static array $dataCodewords = [
        1  => [self::ECC_L => 19,  self::ECC_M => 16,  self::ECC_Q => 13,  self::ECC_H => 9],
        2  => [self::ECC_L => 34,  self::ECC_M => 28,  self::ECC_Q => 22,  self::ECC_H => 16],
        3  => [self::ECC_L => 55,  self::ECC_M => 44,  self::ECC_Q => 34,  self::ECC_H => 26],
        4  => [self::ECC_L => 80,  self::ECC_M => 64,  self::ECC_Q => 48,  self::ECC_H => 36],
        5  => [self::ECC_L => 108, self::ECC_M => 86,  self::ECC_Q => 62,  self::ECC_H => 46],
        6  => [self::ECC_L => 136, self::ECC_M => 108, self::ECC_Q => 76,  self::ECC_H => 60],
        7  => [self::ECC_L => 156, self::ECC_M => 124, self::ECC_Q => 88,  self::ECC_H => 66],
        8  => [self::ECC_L => 194, self::ECC_M => 154, self::ECC_Q => 110, self::ECC_H => 86],
        9  => [self::ECC_L => 232, self::ECC_M => 182, self::ECC_Q => 132, self::ECC_H => 100],
        10 => [self::ECC_L => 274, self::ECC_M => 216, self::ECC_Q => 154, self::ECC_H => 122],
    ];

    /**
     * Total codewords (data + ECC) per version
     */
    private static array $totalCodewords = [
        1 => 26, 2 => 44, 3 => 70, 4 => 100, 5 => 134,
        6 => 172, 7 => 196, 8 => 242, 9 => 292, 10 => 346,
    ];

    /**
     * Block structure: [version][eccLevel] => array of [numBlocks, dataCodewordsPerBlock]
     */
    private static array $blockStructure = [
        1  => [
            self::ECC_L => [[1, 19]],
            self::ECC_M => [[1, 16]],
            self::ECC_Q => [[1, 13]],
            self::ECC_H => [[1, 9]],
        ],
        2  => [
            self::ECC_L => [[1, 34]],
            self::ECC_M => [[1, 28]],
            self::ECC_Q => [[1, 22]],
            self::ECC_H => [[1, 16]],
        ],
        3  => [
            self::ECC_L => [[1, 55]],
            self::ECC_M => [[1, 44]],
            self::ECC_Q => [[2, 17]],
            self::ECC_H => [[2, 13]],
        ],
        4  => [
            self::ECC_L => [[1, 80]],
            self::ECC_M => [[2, 32]],
            self::ECC_Q => [[2, 24]],
            self::ECC_H => [[4, 9]],
        ],
        5  => [
            self::ECC_L => [[1, 108]],
            self::ECC_M => [[2, 43]],
            self::ECC_Q => [[2, 15], [2, 16]],
            self::ECC_H => [[2, 11], [2, 12]],
        ],
        6  => [
            self::ECC_L => [[2, 68]],
            self::ECC_M => [[4, 27]],
            self::ECC_Q => [[4, 19]],
            self::ECC_H => [[4, 15]],
        ],
        7  => [
            self::ECC_L => [[2, 78]],
            self::ECC_M => [[4, 31]],
            self::ECC_Q => [[2, 14], [4, 15]],
            self::ECC_H => [[4, 13], [1, 14]],
        ],
        8  => [
            self::ECC_L => [[2, 97]],
            self::ECC_M => [[2, 38], [2, 39]],
            self::ECC_Q => [[4, 18], [2, 19]],
            self::ECC_H => [[4, 14], [2, 15]],
        ],
        9  => [
            self::ECC_L => [[2, 116]],
            self::ECC_M => [[3, 36], [2, 37]],
            self::ECC_Q => [[4, 16], [4, 17]],
            self::ECC_H => [[4, 12], [4, 13]],
        ],
        10 => [
            self::ECC_L => [[2, 68], [2, 69]],
            self::ECC_M => [[4, 43], [1, 44]],
            self::ECC_Q => [[6, 19], [2, 20]],
            self::ECC_H => [[6, 15], [2, 16]],
        ],
    ];

    /**
     * Alignment pattern center coordinates per version
     */
    private static array $alignmentPatternCoords = [
        1 => [],
        2 => [6, 18],
        3 => [6, 22],
        4 => [6, 26],
        5 => [6, 30],
        6 => [6, 34],
        7 => [6, 22, 38],
        8 => [6, 24, 42],
        9 => [6, 26, 46],
        10 => [6, 28, 50],
    ];

    // Galois Field GF(256) tables for Reed-Solomon computation
    private static array $exp = [];
    private static array $log = [];
    private static bool $gfInitialized = false;

    /**
     * Initialize Galois Field (GF(256)) with primitive polynomial 0x11D (285)
     */
    private static function initGF(): void
    {
        if (self::$gfInitialized) {
            return;
        }

        self::$exp = array_fill(0, 512, 0);
        self::$log = array_fill(0, 256, 0);

        $val = 1;
        for ($i = 0; $i < 255; $i++) {
            self::$exp[$i] = $val;
            self::$log[$val] = $i;
            $val <<= 1;
            if ($val & 0x100) {
                $val ^= 0x11D;
            }
        }
        for ($i = 255; $i < 512; $i++) {
            self::$exp[$i] = self::$exp[$i - 255];
        }

        self::$gfInitialized = true;
    }

    private static function gfMul(int $x, int $y): int
    {
        if ($x === 0 || $y === 0) {
            return 0;
        }
        return self::$exp[self::$log[$x] + self::$log[$y]];
    }

    /**
     * Compute Reed-Solomon error correction codewords
     */
    private static function computeEcc(array $data, int $eccCount): array
    {
        self::initGF();

        // Compute generator polynomial: prod_{i=0}^{eccCount-1} (x - alpha^i)
        $gen = [1];
        for ($i = 0; $i < $eccCount; $i++) {
            $next = [1];
            $factor = self::$exp[$i];
            $len = count($gen);
            $newGen = array_fill(0, $len + 1, 0);
            for ($j = 0; $j < $len; $j++) {
                $newGen[$j] ^= $gen[$j];
                $newGen[$j + 1] ^= self::gfMul($gen[$j], $factor);
            }
            $gen = $newGen;
        }

        $res = array_merge($data, array_fill(0, $eccCount, 0));
        $dataLen = count($data);

        for ($i = 0; $i < $dataLen; $i++) {
            $coef = $res[$i];
            if ($coef !== 0) {
                for ($j = 0; $j <= $eccCount; $j++) {
                    $res[$i + $j] ^= self::gfMul($gen[$j], $coef);
                }
            }
        }

        return array_slice($res, $dataLen, $eccCount);
    }

    /**
     * Choose appropriate QR version for text length
     */
    public static function determineVersion(string $text, int $eccLevel = self::ECC_M): int
    {
        $byteCount = strlen($text);
        foreach (self::$capacityTable as $ver => $levels) {
            if ($levels[$eccLevel] >= $byteCount) {
                return $ver;
            }
        }
        return 10;
    }

    /**
     * Generate the 2D boolean matrix of QR modules
     */
    public static function createMatrix(string $text, int $eccLevel = self::ECC_M, ?int $version = null): array
    {
        if ($version === null) {
            $version = self::determineVersion($text, $eccLevel);
        }

        $size = 17 + 4 * $version;
        $matrix = array_fill(0, $size, array_fill(0, $size, null));
        $reserved = array_fill(0, $size, array_fill(0, $size, false));

        // 1. Finder patterns
        self::placeFinder($matrix, $reserved, 0, 0);
        self::placeFinder($matrix, $reserved, $size - 7, 0);
        self::placeFinder($matrix, $reserved, 0, $size - 7);

        // 2. Separators
        self::placeSeparators($matrix, $reserved, $size);

        // 3. Alignment patterns (versions >= 2)
        if (isset(self::$alignmentPatternCoords[$version])) {
            $coords = self::$alignmentPatternCoords[$version];
            foreach ($coords as $r) {
                foreach ($coords as $c) {
                    if ($reserved[$r][$c]) {
                        continue;
                    }
                    self::placeAlignment($matrix, $reserved, $r, $c);
                }
            }
        }

        // 4. Timing patterns
        for ($i = 8; $i < $size - 8; $i++) {
            $val = ($i % 2 === 0);
            if (!$reserved[6][$i]) {
                $matrix[6][$i] = $val;
                $reserved[6][$i] = true;
            }
            if (!$reserved[$i][6]) {
                $matrix[$i][6] = $val;
                $reserved[$i][6] = true;
            }
        }

        // 5. Dark module
        $matrix[4 * $version + 9][8] = true;
        $reserved[4 * $version + 9][8] = true;

        // 6. Reserve format information areas
        for ($i = 0; $i < 9; $i++) {
            $reserved[8][$i] = true;
            $reserved[$i][8] = true;
        }
        for ($i = 0; $i < 8; $i++) {
            $reserved[8][$size - 1 - $i] = true;
            $reserved[$size - 1 - $i][8] = true;
        }

        // 7. Encode data into codewords
        $codewords = self::encodeData($text, $version, $eccLevel);

        // 8. Place codewords in matrix
        self::placeDataBits($matrix, $reserved, $size, $codewords);

        // 9. Select best mask pattern (0..7) and apply
        $bestMask = 0;
        $bestScore = PHP_INT_MAX;
        $bestMatrix = null;

        for ($mask = 0; $mask < 8; $mask++) {
            $testMatrix = $matrix;
            self::applyMask($testMatrix, $reserved, $size, $mask);
            self::placeFormatInfo($testMatrix, $size, $eccLevel, $mask);
            $score = self::calculatePenalty($testMatrix, $size);
            if ($score < $bestScore) {
                $bestScore = $score;
                $bestMask = $mask;
                $bestMatrix = $testMatrix;
            }
        }

        return $bestMatrix ?? $matrix;
    }

    private static function placeFinder(array &$matrix, array &$reserved, int $r, int $c): void
    {
        for ($i = 0; $i < 7; $i++) {
            for ($j = 0; $j < 7; $j++) {
                $isBorder = ($i === 0 || $i === 6 || $j === 0 || $j === 6);
                $isCenter = ($i >= 2 && $i <= 4 && $j >= 2 && $j <= 4);
                $matrix[$r + $i][$c + $j] = ($isBorder || $isCenter);
                $reserved[$r + $i][$c + $j] = true;
            }
        }
    }

    private static function placeSeparators(array &$matrix, array &$reserved, int $size): void
    {
        // Top-left separator
        for ($i = 0; $i < 8; $i++) {
            if ($i < $size) {
                $matrix[7][$i] = false;
                $reserved[7][$i] = true;
                $matrix[$i][7] = false;
                $reserved[$i][7] = true;
            }
        }
        // Top-right separator
        for ($i = 0; $i < 8; $i++) {
            $c = $size - 8 + $i;
            if ($c >= 0 && $c < $size) {
                $matrix[7][$c] = false;
                $reserved[7][$c] = true;
            }
            $r = $i;
            if ($size - 8 >= 0) {
                $matrix[$r][$size - 8] = false;
                $reserved[$r][$size - 8] = true;
            }
        }
        // Bottom-left separator
        for ($i = 0; $i < 8; $i++) {
            $r = $size - 8 + $i;
            if ($r >= 0 && $r < $size) {
                $matrix[$r][7] = false;
                $reserved[$r][7] = true;
            }
            $c = $i;
            if ($size - 8 >= 0) {
                $matrix[$size - 8][$c] = false;
                $reserved[$size - 8][$c] = true;
            }
        }
    }

    private static function placeAlignment(array &$matrix, array &$reserved, int $centerR, int $centerC): void
    {
        for ($i = -2; $i <= 2; $i++) {
            for ($j = -2; $j <= 2; $j++) {
                $r = $centerR + $i;
                $c = $centerC + $j;
                $isBorder = (abs($i) === 2 || abs($j) === 2);
                $isCenter = ($i === 0 && $j === 0);
                $matrix[$r][$c] = ($isBorder || $isCenter);
                $reserved[$r][$c] = true;
            }
        }
    }

    private static function encodeData(string $text, int $version, int $eccLevel): array
    {
        $bits = [];
        // Mode indicator: 0100 for Byte mode
        self::appendBits($bits, 0b0100, 4);

        // Character count indicator (8 bits for versions 1..9, 16 bits for version 10+)
        $countBits = ($version < 10) ? 8 : 16;
        $byteLen = strlen($text);
        self::appendBits($bits, $byteLen, $countBits);

        // Character data
        for ($i = 0; $i < $byteLen; $i++) {
            self::appendBits($bits, ord($text[$i]), 8);
        }

        $totalDataCodewords = self::$dataCodewords[$version][$eccLevel];
        $totalDataBits = $totalDataCodewords * 8;

        // Terminator (up to 4 zeroes)
        $neededZeroes = min(4, $totalDataBits - count($bits));
        self::appendBits($bits, 0, $neededZeroes);

        // Pad to byte boundary
        while (count($bits) % 8 !== 0) {
            $bits[] = 0;
        }

        // Pad bytes (0xEC, 0x11 alternating)
        $padBytes = [0xEC, 0x11];
        $padIdx = 0;
        while (count($bits) < $totalDataBits) {
            self::appendBits($bits, $padBytes[$padIdx % 2], 8);
            $padIdx++;
        }

        // Convert data bits to bytes
        $dataBytes = [];
        for ($i = 0; $i < count($bits); $i += 8) {
            $byte = 0;
            for ($b = 0; $b < 8; $b++) {
                $byte = ($byte << 1) | $bits[$i + $b];
            }
            $dataBytes[] = $byte;
        }

        // Partition into blocks & compute Reed-Solomon ECC
        $blockInfo = self::$blockStructure[$version][$eccLevel];
        $dataBlocks = [];
        $eccBlocks = [];

        $offset = 0;
        $totalEccCodewords = self::$totalCodewords[$version] - $totalDataCodewords;
        $totalBlocks = 0;
        foreach ($blockInfo as $info) {
            $totalBlocks += $info[0];
        }
        $eccPerBlock = (int) ($totalEccCodewords / $totalBlocks);

        foreach ($blockInfo as $info) {
            [$numBlocks, $dataCount] = $info;
            for ($b = 0; $b < $numBlocks; $b++) {
                $blockData = array_slice($dataBytes, $offset, $dataCount);
                $offset += $dataCount;
                $dataBlocks[] = $blockData;
                $eccBlocks[] = self::computeEcc($blockData, $eccPerBlock);
            }
        }

        // Interleave data and ECC codewords
        $interleaved = [];
        $maxDataLen = 0;
        foreach ($dataBlocks as $db) {
            $maxDataLen = max($maxDataLen, count($db));
        }

        for ($i = 0; $i < $maxDataLen; $i++) {
            foreach ($dataBlocks as $db) {
                if ($i < count($db)) {
                    $interleaved[] = $db[$i];
                }
            }
        }

        for ($i = 0; $i < $eccPerBlock; $i++) {
            foreach ($eccBlocks as $eb) {
                if ($i < count($eb)) {
                    $interleaved[] = $eb[$i];
                }
            }
        }

        return $interleaved;
    }

    private static function appendBits(array &$bits, int $val, int $count): void
    {
        for ($i = $count - 1; $i >= 0; $i--) {
            $bits[] = ($val >> $i) & 1;
        }
    }

    private static function placeDataBits(array &$matrix, array $reserved, int $size, array $codewords): void
    {
        $bits = [];
        foreach ($codewords as $cw) {
            for ($b = 7; $b >= 0; $b--) {
                $bits[] = ($cw >> $b) & 1;
            }
        }

        $bitIdx = 0;
        $totalBits = count($bits);
        $up = true;

        for ($right = $size - 1; $right > 0; $right -= 2) {
            // Column 6 is vertical timing pattern: skip
            if ($right === 6) {
                $right--;
            }

            for ($vert = 0; $vert < $size; $vert++) {
                $r = $up ? ($size - 1 - $vert) : $vert;

                for ($colOffset = 0; $colOffset < 2; $colOffset++) {
                    $c = $right - $colOffset;
                    if (!$reserved[$r][$c]) {
                        $val = ($bitIdx < $totalBits) ? ($bits[$bitIdx] === 1) : false;
                        $matrix[$r][$c] = $val;
                        $bitIdx++;
                    }
                }
            }
            $up = !$up;
        }
    }

    private static function applyMask(array &$matrix, array $reserved, int $size, int $mask): void
    {
        for ($r = 0; $r < $size; $r++) {
            for ($c = 0; $c < $size; $c++) {
                if ($reserved[$r][$c]) {
                    continue;
                }

                $invert = match ($mask) {
                    0 => ($r + $c) % 2 === 0,
                    1 => $r % 2 === 0,
                    2 => $c % 3 === 0,
                    3 => ($r + $c) % 3 === 0,
                    4 => ((int) ($r / 2) + (int) ($c / 3)) % 2 === 0,
                    5 => (($r * $c) % 2) + (($r * $c) % 3) === 0,
                    6 => ((($r * $c) % 2) + (($r * $c) % 3)) % 2 === 0,
                    7 => ((($r + $c) % 2) + (($r * $c) % 3)) % 2 === 0,
                    default => false,
                };

                if ($invert) {
                    $matrix[$r][$c] = !$matrix[$r][$c];
                }
            }
        }
    }

    private static function placeFormatInfo(array &$matrix, int $size, int $eccLevel, int $mask): void
    {
        // 5 data bits: 2 bits ECC level + 3 bits mask
        // Standard mapping: L=01, M=00, Q=11, H=10
        $eccBits = match ($eccLevel) {
            self::ECC_L => 0b01,
            self::ECC_M => 0b00,
            self::ECC_Q => 0b11,
            self::ECC_H => 0b10,
            default => 0b00,
        };

        $formatData = ($eccBits << 3) | $mask;

        // BCH(15, 5) code: generator polynomial 0x537 (10100110111)
        $rem = $formatData << 10;
        for ($i = 4; $i >= 0; $i--) {
            if ($rem & (1 << ($i + 10))) {
                $rem ^= (0x537 << $i);
            }
        }

        $format = (($formatData << 10) | $rem) ^ 0x5412; // XOR with mask 101010000010010

        // Place 15 format bits
        // Around top-left finder pattern
        $coordsTopLeft = [
            [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
            [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
        ];

        // Around top-right and bottom-left
        $coordsSplit = [
            [$size - 1, 8], [$size - 2, 8], [$size - 3, 8], [$size - 4, 8],
            [$size - 5, 8], [$size - 6, 8], [$size - 7, 8],
            [8, $size - 8], [8, $size - 7], [8, $size - 6], [8, $size - 5],
            [8, $size - 4], [8, $size - 3], [8, $size - 2], [8, $size - 1]
        ];

        for ($i = 0; $i < 15; $i++) {
            $bit = (($format >> $i) & 1) === 1;
            [$r1, $c1] = $coordsTopLeft[$i];
            $matrix[$r1][$c1] = $bit;

            [$r2, $c2] = $coordsSplit[$i];
            $matrix[$r2][$c2] = $bit;
        }
    }

    private static function calculatePenalty(array $matrix, int $size): int
    {
        $penalty = 0;

        // Rule 1: 5 or more consecutive modules of same color
        for ($r = 0; $r < $size; $r++) {
            $count = 1;
            for ($c = 1; $c < $size; $c++) {
                if ($matrix[$r][$c] === $matrix[$r][$c - 1]) {
                    $count++;
                } else {
                    if ($count >= 5) {
                        $penalty += 3 + ($count - 5);
                    }
                    $count = 1;
                }
            }
            if ($count >= 5) {
                $penalty += 3 + ($count - 5);
            }
        }

        for ($c = 0; $c < $size; $c++) {
            $count = 1;
            for ($r = 1; $r < $size; $r++) {
                if ($matrix[$r][$c] === $matrix[$r - 1][$c]) {
                    $count++;
                } else {
                    if ($count >= 5) {
                        $penalty += 3 + ($count - 5);
                    }
                    $count = 1;
                }
            }
            if ($count >= 5) {
                $penalty += 3 + ($count - 5);
            }
        }

        // Rule 2: 2x2 blocks of same color
        for ($r = 0; $r < $size - 1; $r++) {
            for ($c = 0; $c < $size - 1; $c++) {
                $val = $matrix[$r][$c];
                if ($val === $matrix[$r + 1][$c] &&
                    $val === $matrix[$r][$c + 1] &&
                    $val === $matrix[$r + 1][$c + 1]) {
                    $penalty += 3;
                }
            }
        }

        return $penalty;
    }

    /**
     * Render QR code as SVG XML string
     */
    public static function toSvg(string $text, int $size = 280, int $margin = 4): string
    {
        $matrix = self::createMatrix($text, self::ECC_M);
        $moduleCount = count($matrix);
        $totalModules = $moduleCount + $margin * 2;
        $scale = $size / $totalModules;

        $path = '';
        for ($r = 0; $r < $moduleCount; $r++) {
            for ($c = 0; $c < $moduleCount; $c++) {
                if ($matrix[$r][$c]) {
                    $x = ($c + $margin) * $scale;
                    $y = ($r + $margin) * $scale;
                    $path .= sprintf('M%.2f,%.2fh%.2fv%.2fh-%.2fz ', $x, $y, $scale, $scale, $scale);
                }
            }
        }

        return sprintf(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %1$d %1$d" width="%1$d" height="%1$d">' .
            '<rect width="100%%" height="100%%" fill="#FFFFFF"/>' .
            '<path d="%2$s" fill="#0F172A"/>' .
            '</svg>',
            $size,
            trim($path)
        );
    }

    /**
     * Render QR code as PNG Base64 Data URI
     */
    public static function toPngDataUri(string $text, int $size = 320, int $margin = 4): string
    {
        $matrix = self::createMatrix($text, self::ECC_M);
        $moduleCount = count($matrix);
        $totalModules = $moduleCount + $margin * 2;
        $moduleSize = max(1, (int) floor($size / $totalModules));
        $actualSize = $totalModules * $moduleSize;

        $im = imagecreatetruecolor($actualSize, $actualSize);
        $white = imagecolorallocate($im, 255, 255, 255);
        $dark = imagecolorallocate($im, 15, 23, 42); // slate-900

        imagefilledrectangle($im, 0, 0, $actualSize, $actualSize, $white);

        for ($r = 0; $r < $moduleCount; $r++) {
            for ($c = 0; $c < $moduleCount; $c++) {
                if ($matrix[$r][$c]) {
                    $x1 = ($c + $margin) * $moduleSize;
                    $y1 = ($r + $margin) * $moduleSize;
                    $x2 = $x1 + $moduleSize - 1;
                    $y2 = $y1 + $moduleSize - 1;
                    imagefilledrectangle($im, $x1, $y1, $x2, $y2, $dark);
                }
            }
        }

        ob_start();
        imagepng($im);
        $pngData = ob_get_clean();
        imagedestroy($im);

        return 'data:image/png;base64,' . base64_encode($pngData);
    }
}

