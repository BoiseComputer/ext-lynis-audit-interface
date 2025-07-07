<?php

class ApiController extends pm_Controller_Action
{
    protected $_accessLevel = 'admin';

    public function pingAction(): void
    {
        $this->getHelper('json')->sendJson(['status' => 'ok', 'time' => time()]);
    }

    // Check if Lynis is installed
    public function checkLynisAction(): void
    {
        $this->getHelper('json')->sendJson(['installed' => false, 'debug' => 'basic_response']);
    }

    // Install Lynis
    public function installLynisAction(): void
    {
        $this->getHelper('json')->sendJson(['success' => false, 'message' => 'Not implemented yet']);
    }

    // Run Lynis audit
    public function runAuditAction(): void
    {
        $this->getHelper('json')->sendJson(['success' => false, 'message' => 'Not implemented yet']);
    }

    // Get latest Lynis audit results (parsed)
    public function getResultsAction(): void
    {
        $this->getHelper('json')->sendJson(['success' => false, 'message' => 'Not implemented yet']);
    }
}
