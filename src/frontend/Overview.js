import {
    Alert,
    Button,
    Spinner,
    Table,
    Component,
    createElement,
    PropTypes,
} from '@plesk/plesk-ext-sdk';

import axios from 'axios';

export default class Overview extends Component {
    static propTypes = {
        baseUrl: PropTypes.string.isRequired,
    };

    state = {
        lynisInstalled: null,
        installing: false,
        running: false,
        results: null,
        message: '',
        messageType: '',
        refreshing: false,
    };

    componentDidMount() {
        this.checkLynis();
    }

    handleError = (error) => {
        let msg = 'An error occurred.';
        if (error.response && error.response.data && error.response.data.message) {
            msg = error.response.data.message;
        } else if (error.message) {
            msg = error.message;
        }
        this.setState({ message: msg, messageType: 'error', installing: false, running: false, refreshing: false });
    };

    checkLynis = () => {
        const { baseUrl } = this.props;
        axios.get(`${baseUrl}/api/check-lynis`).then(({ data }) => {
            this.setState({ lynisInstalled: data.installed });
            if (data.installed) {
                this.fetchResults();
            }
        }).catch(this.handleError);
    };

    installLynis = () => {
        const { baseUrl } = this.props;
        this.setState({ installing: true, message: '', messageType: '' });
        axios.post(`${baseUrl}/api/install-lynis`).then(({ data }) => {
            this.setState({
                installing: false,
                message: data.message,
                messageType: data.success ? 'success' : 'error',
            });
            if (data.success) {
                this.setState({ lynisInstalled: true });
                this.fetchResults();
            }
        }).catch(this.handleError);
    };

    runAudit = () => {
        const { baseUrl } = this.props;
        this.setState({ running: true, message: '', messageType: '' });
        axios.post(`${baseUrl}/api/run-audit`).then(({ data }) => {
            this.setState({
                running: false,
                message: data.message,
                messageType: data.success ? 'success' : 'error',
            });
            if (data.success) {
                this.fetchResults();
            }
        }).catch(this.handleError);
    };

    fetchResults = () => {
        const { baseUrl } = this.props;
        this.setState({ refreshing: true });
        axios.get(`${baseUrl}/api/get-results`).then(({ data }) => {
            if (data.success) {
                this.setState({ results: data });
            }
            this.setState({ refreshing: false });
        }).catch((err) => {
            this.setState({ refreshing: false });
            this.handleError(err);
        });
    };

    render() {
        const { lynisInstalled, installing, running, results, message, messageType, refreshing } = this.state;

        return (
            <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
                {message && <Alert intent={messageType} style={{ marginBottom: 16 }}>{message}</Alert>}
                {lynisInstalled === null && <Spinner>Checking Lynis status…</Spinner>}
                {lynisInstalled === false && !installing && (
                    <div style={{ marginBottom: 24 }}>
                        <Alert intent="warning">Lynis is not installed on this server.</Alert>
                        <Button onClick={this.installLynis}>Install Lynis</Button>
                    </div>
                )}
                {installing && <Spinner>Installing Lynis…</Spinner>}
                {lynisInstalled && (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <Button onClick={this.runAudit} disabled={running} intent="primary" style={{ marginRight: 8 }}>
                                {running ? 'Running Audit…' : 'Run Lynis Audit'}
                            </Button>
                            <Button onClick={this.fetchResults} disabled={refreshing || running} intent="default">
                                {refreshing ? 'Refreshing…' : 'Refresh Results'}
                            </Button>
                        </div>
                        {running && <Spinner>Running audit…</Spinner>}
                        {results && (
                            <div style={{ marginTop: 24 }}>
                                <h3>Audit Results</h3>
                                <div style={{ marginBottom: 8 }}><b>Hardening Index:</b> {results.score || 'N/A'}</div>
                                <div style={{ marginTop: 12 }}>
                                    <b>Warnings:</b>
                                    {results.warnings && results.warnings.length ? (
                                        <ul>{results.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                                    ) : ' None'}
                                </div>
                                <div style={{ marginTop: 12 }}>
                                    <b>Suggestions:</b>
                                    {results.suggestions && results.suggestions.length ? (
                                        <ul>{results.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                    ) : ' None'}
                                </div>
                                <details style={{ marginTop: 12 }}>
                                    <summary>Show raw report</summary>
                                    <pre style={{ maxHeight: 300, overflow: 'auto', background: '#f8f8f8', padding: 8 }}>{results.raw}</pre>
                                </details>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
}
