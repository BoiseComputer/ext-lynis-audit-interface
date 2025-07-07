import React from 'react';
import ReactDOM from 'react-dom';
import Overview from './Overview';

export default function main(params) {
    console.log('Lynis Audit Interface main() called with params:', params);
    const { moduleId, baseUrl, locale } = params;
    const root = document.getElementById(moduleId);
    if (root) {
        root.innerHTML = '<b style="color:green">React is mounting...</b>';
        setTimeout(() => {
            ReactDOM.render(
                <Overview baseUrl={baseUrl} locale={locale} />,
                root
            );
        }, 500); // Delay to see the message
    } else {
        document.body.innerHTML += '<div style="color:red">No root element found for moduleId: ' + moduleId + '</div>';
    }
}
