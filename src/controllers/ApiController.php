<?php

use PleskExt\LynisAuditInterface\Helper;

class ApiController extends pm_Controller_Action
{
    protected $_accessLevel = 'admin';
    
    public function init()
    {
        parent::init();
        $this->_helper->getHelper('contextSwitch')->addActionContext('*', 'json');
        $this->_helper->getHelper('contextSwitch')->initContext('json');
    }

    public function pingAction(): void
    {
        $this->getHelper('json')->sendJson(Helper::getTime());
    }

    // Check if Lynis is installed
    public function checkLynisAction(): void
    {
        $result = Helper::isLynisInstalled();
        $this->getHelper('json')->sendJson(['installed' => $result]);
    }

    // Install Lynis
    public function installLynisAction(): void
    {
        $result = Helper::installLynis();
        $this->getHelper('json')->sendJson(['success' => $result['success'], 'message' => $result['message']]);
    }

    // Run Lynis audit
    public function runAuditAction(): void
    {
        $result = Helper::runLynisAudit();
        $this->getHelper('json')->sendJson(['success' => $result['success'], 'message' => $result['message']]);
    }

    // Get latest Lynis audit results (parsed)
    public function getResultsAction(): void
    {
        $result = Helper::getLynisResults();
        $this->getHelper('json')->sendJson($result);
    }
}
