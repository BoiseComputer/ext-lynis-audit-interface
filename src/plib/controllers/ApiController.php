<?php
require_once __DIR__ . '/../library/Helper.php';

class ApiController extends pm_Controller_Action
{
    protected $_accessLevel = 'admin';

    public function pingAction(): void
    {
        $this->_helper->json(['status' => 'ok', 'time' => time(), 'message' => 'API is working']);
    }

    // Test endpoint for debugging
    public function testAction(): void
    {
        $this->_helper->json(['test' => 'success', 'timestamp' => date('Y-m-d H:i:s')]);
    }

    // Check if Lynis is installed
    public function checkLynisAction(): void
    {
        $installed = \PleskExt\LynisAuditInterface\Helper::isLynisInstalled();
        $this->_helper->json(['installed' => $installed]);
    }

    // Install Lynis
    public function installLynisAction(): void
    {
        $result = \PleskExt\LynisAuditInterface\Helper::installLynis();
        $this->_helper->json($result);
    }

    // Run Lynis audit
    public function runAuditAction(): void
    {
        $params = $this->getRequest()->getParams();
        $result = \PleskExt\LynisAuditInterface\Helper::runLynisAudit($params);
        $this->_helper->json($result);
    }

    // Get latest Lynis audit results (parsed)
    public function getResultsAction(): void
    {
        $result = \PleskExt\LynisAuditInterface\Helper::getLynisResults();
        $this->_helper->json($result);
    }
}
