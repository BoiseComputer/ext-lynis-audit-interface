<?php
// Lynis Audit Interface for Plesk - Main Interface Controller

class IndexController extends pm_Controller_Action
{
    protected $_accessLevel = 'admin';

    public function indexAction()
    {
        // Serve the React application directly
        $this->_helper->_viewRenderer->setNoRender();

        $baseUrl = pm_Context::getBaseUrl();
        $moduleId = pm_Context::getModuleId();

        // Set the base URL correctly for API calls
        $params = json_encode([
            'moduleId' => $moduleId,
            'baseUrl' => $baseUrl,
            'locale' => pm_Locale::getSection('app'),
        ]);

        echo <<<HTML
<!DOCTYPE html>
<html>
<head>
    <title>Lynis Audit Interface</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
    <div id="$moduleId" style="border:2px solid red;min-height:100px;">
        If you see this, the backend is working. If this disappears, the React app is mounting.<br>
        <b>baseUrl:</b> $baseUrl<br>
        <b>Script path:</b> {$baseUrl}dist/main.js
    </div>
    <noscript><b>JavaScript is required for this extension.</b></noscript>
    <script>
        require(['{$baseUrl}dist/main.js'], function (main) {
            main.default($params);
        });
    </script>
</body>
</html>
HTML;
    }
}
