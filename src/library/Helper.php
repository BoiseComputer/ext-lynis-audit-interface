<?php

namespace PleskExt\LynisAuditInterface;

class Helper
{
    public static function getTime(): int
    {
        return time();
    }

    // Check if Lynis is installed
    public static function isLynisInstalled(): bool
    {
        $output = shell_exec('command -v lynis');
        return !empty($output);
    }

    // Attempt to install Lynis (Debian/Ubuntu: apt, else fail)
    public static function installLynis(): array
    {
        if (self::isLynisInstalled()) {
            return ['success' => true, 'message' => 'Lynis is already installed.'];
        }
        // Try apt-get (Debian/Ubuntu)
        $output = shell_exec('apt-get update && apt-get install -y lynis 2>&1');
        if (self::isLynisInstalled()) {
            return ['success' => true, 'message' => 'Lynis installed successfully.'];
        }
        return ['success' => false, 'message' => 'Failed to install Lynis. Output: ' . $output];
    }

    // Run Lynis audit and save results
    public static function runLynisAudit(): array
    {
        if (!self::isLynisInstalled()) {
            return ['success' => false, 'message' => 'Lynis is not installed.'];
        }
        $reportFile = '/var/log/lynis-report.dat';
        $output = shell_exec('lynis audit system --quick --no-colors > /tmp/lynis-output.txt 2>&1');
        if (file_exists($reportFile)) {
            return ['success' => true, 'message' => 'Audit completed.'];
        }
        return ['success' => false, 'message' => 'Audit failed. Output: ' . $output];
    }

    // Parse and return latest Lynis audit results
    public static function getLynisResults(): array
    {
        $reportFile = '/var/log/lynis-report.dat';
        if (!file_exists($reportFile)) {
            return ['success' => false, 'message' => 'No Lynis report found.'];
        }
        $data = file_get_contents($reportFile);
        $results = [
            'warnings' => [],
            'suggestions' => [],
            'score' => null,
            'raw' => $data
        ];
        foreach (explode("\n", $data) as $line) {
            if (strpos($line, 'warning[]=') === 0) {
                $results['warnings'][] = substr($line, 9);
            }
            if (strpos($line, 'suggestion[]=') === 0) {
                $results['suggestions'][] = substr($line, 13);
            }
            if (strpos($line, 'hardening_index=') === 0) {
                $results['score'] = substr($line, 16);
            }
        }
        $results['success'] = true;
        return $results;
    }
}
