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

    // Check if a Lynis audit is currently running
    public static function isLynisRunning(): bool
    {
        $output = shell_exec("ps -C lynis -o cmd= 2>/dev/null");
        return !empty($output);
    }

    // Run Lynis audit and save results
    public static function runLynisAudit($options = []): array
    {
        if (!self::isLynisInstalled()) {
            return ['success' => false, 'message' => 'Lynis is not installed.'];
        }
        if (self::isLynisRunning()) {
            return ['success' => false, 'message' => 'A Lynis audit is already running. Please wait for it to finish.'];
        }
        $reportFile = '/var/log/lynis-report.dat';
        $cmd = 'lynis audit system';
        // Add options
        if (!empty($options['categories'])) {
            $cats = escapeshellarg($options['categories']);
            $cmd .= " --tests-category $cats";
        }
        if (!empty($options['skipTests'])) {
            $skip = escapeshellarg($options['skipTests']);
            $cmd .= " --skip-tests $skip";
        }
        if (!empty($options['extraParams'])) {
            $cmd .= ' ' . $options['extraParams'];
        }
        // Always add these for UI
        $cmd .= ' --no-colors --quick';
        $output = shell_exec("$cmd > /tmp/lynis-output.txt 2>&1");
        if (file_exists($reportFile)) {
            return ['success' => true, 'message' => 'Audit completed.'];
        }
        return ['success' => false, 'message' => 'Audit failed. Output: ' . $output];
    }

    // Parse Lynis warning/suggestion lines into structured objects
    private static function parseLynisMessage($line)
    {
        // Example: 'W:CODE|Description [test:TESTID] [solution:Remediation steps]'
        $pattern = '/^(?P<code>[^|]+)\|(?P<description>[^\[]+)(\[test:(?P<test>[^\]]+)\])?(\[solution:(?P<remediation>[^\]]+)\])?/';
        $result = [
            'code' => null,
            'description' => trim($line),
            'remediation' => null
        ];
        if (preg_match($pattern, $line, $matches)) {
            $result['code'] = isset($matches['code']) ? trim($matches['code']) : null;
            $result['description'] = isset($matches['description']) ? trim($matches['description']) : trim($line);
            $result['remediation'] = isset($matches['remediation']) ? trim($matches['remediation']) : null;
        }
        return $result;
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
                $msg = substr($line, 9);
                $results['warnings'][] = self::parseLynisMessage($msg);
            }
            if (strpos($line, 'suggestion[]=') === 0) {
                $msg = substr($line, 13);
                $results['suggestions'][] = self::parseLynisMessage($msg);
            }
            if (strpos($line, 'hardening_index=') === 0) {
                $results['score'] = substr($line, 16);
            }
        }
        $results['success'] = true;
        return $results;
    }
}
