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
import FileSaver from 'file-saver';

export default class Overview extends Component {
    static propTypes = {
        baseUrl: PropTypes.string.isRequired,
    };

    // Known Lynis categories (official)
    static LYNIS_CATEGORIES = [
        'performance', 'privacy', 'security'
    ];

    // Known Lynis test IDs with descriptions (partial, can be expanded)
    static LYNIS_TESTS = [
        { id: 'ACCT-9622', description: 'Check for available Linux accounting information (security)' },
        { id: 'ACCT-9626', description: 'Check for sysstat accounting data (security)' },
        { id: 'ACCT-9628', description: 'Check for auditd (security)' },
        { id: 'ACCT-9630', description: 'Check for auditd rules (security)' },
        { id: 'AUTH-9204', description: 'Check users with an UID of zero (security)' },
        { id: 'AUTH-9208', description: 'Check non-unique accounts in passwd file (security)' },
        { id: 'AUTH-9212', description: 'Test group file (security)' },
        { id: 'AUTH-9216', description: 'Check group and shadow group files (security)' },
        { id: 'AUTH-9222', description: 'Check for non unique groups (security)' },
        { id: 'AUTH-9226', description: 'Check non unique group names (security)' },
        { id: 'AUTH-9228', description: 'Check password file consistency with pwck (security)' },
        { id: 'AUTH-9229', description: 'Check password hashing methods (security)' },
        { id: 'AUTH-9230', description: 'Check group password hashing rounds (security)' },
        { id: 'AUTH-9234', description: 'Query user accounts (security)' },
        { id: 'AUTH-9250', description: 'Checking sudoers file (security)' },
        { id: 'AUTH-9328', description: 'Default umask values (security)' },
        { id: 'MALW-3280', description: 'Check if anti-virus tool is installed (security)' },
        { id: 'FILE-6394', description: 'Test swappiness of virtual memory (performance)' },
        // ...add more as needed...
    ];

    state = {
        lynisInstalled: null,
        installing: false,
        running: false,
        results: null,
        message: '',
        messageType: '',
        refreshing: false,
        // Options for customizing the scan
        categories: '', // e.g. "malware,authentication"
        skipTests: '', // e.g. "MALW-3280,AUTH-9328"
        extraParams: '', // any extra CLI params
        filterText: ['', ''], // Filtering state for warnings and suggestions
        detailsRow: null, // Row details for the details dialog
        loading: true, // Add loading state to prevent premature rendering
    };

    componentDidMount() {
        this.mounted = true;
        try {
            this.checkLynis();
        } catch (error) {
            console.error('Error in componentDidMount:', error);
            if (this.mounted) {
                this.setState({
                    loading: false,
                    message: 'Error initializing component',
                    messageType: 'error'
                });
            }
        }
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    // Safe setState that checks if component is still mounted
    safeSetState = (stateUpdate) => {
        if (this.mounted) {
            if (typeof stateUpdate === 'function') {
                this.setState(stateUpdate);
            } else {
                this.setState(stateUpdate);
            }
        }
    };

    handleError = (error) => {
        let msg = 'An error occurred.';
        if (error.response && error.response.data && error.response.data.message) {
            msg = error.response.data.message;
        } else if (error.message) {
            msg = error.message;
        }
        this.safeSetState(prevState => ({
            ...prevState,
            message: msg,
            messageType: 'error',
            installing: false,
            running: false,
            refreshing: false
        }));
    };

    checkLynis = () => {
        const { baseUrl } = this.props;
        axios.get(`${baseUrl}/api/check-lynis`).then(({ data }) => {
            if (data && typeof data.installed === 'boolean') {
                this.safeSetState(prevState => ({
                    ...prevState,
                    lynisInstalled: data.installed,
                    loading: false
                }));
                if (data.installed) {
                    this.fetchResults();
                }
            } else {
                console.warn('Invalid API response:', data);
                this.safeSetState(prevState => ({
                    ...prevState,
                    lynisInstalled: false,
                    loading: false
                }));
            }
        }).catch((err) => {
            this.safeSetState(prevState => ({
                ...prevState,
                loading: false
            }));
            this.handleError(err);
        });
    };

    installLynis = () => {
        const { baseUrl } = this.props;
        this.setState({ installing: true, message: '', messageType: '' });
        axios.post(`${baseUrl}/api/install-lynis`).then(({ data }) => {
            if (data && typeof data.success === 'boolean') {
                this.setState({
                    installing: false,
                    message: data.message || 'Operation completed',
                    messageType: data.success ? 'success' : 'error',
                });
                if (data.success) {
                    this.setState({ lynisInstalled: true });
                    this.fetchResults();
                }
            } else {
                console.warn('Invalid API response:', data);
                this.setState({
                    installing: false,
                    message: 'Invalid response from server',
                    messageType: 'error',
                });
            }
        }).catch(this.handleError);
    };

    runAudit = () => {
        const { baseUrl } = this.props;
        this.setState({ running: true, message: '', messageType: '' });
        axios.post(`${baseUrl}/api/run-audit`, {
            categories: this.state.categories,
            skipTests: this.state.skipTests,
            extraParams: this.state.extraParams,
        }).then(({ data }) => {
            if (data && typeof data.success === 'boolean') {
                this.setState({
                    running: false,
                    message: data.message || 'Operation completed',
                    messageType: data.success ? 'success' : 'error',
                });
                if (data.success) {
                    this.fetchResults();
                }
            } else {
                console.warn('Invalid API response:', data);
                this.setState({
                    running: false,
                    message: 'Invalid response from server',
                    messageType: 'error',
                });
            }
        }).catch(this.handleError);
    };

    fetchResults = () => {
        const { baseUrl } = this.props;
        this.safeSetState({ refreshing: true });
        axios.get(`${baseUrl}/api/get-results`).then(({ data }) => {
            try {
                console.log('API response data:', data);
                // Build a plain object for results
                const cleanResults = {
                    warnings: Array.isArray(data.warnings) ? data.warnings.map(w => ({ ...w })) : [],
                    suggestions: Array.isArray(data.suggestions) ? data.suggestions.map(s => ({ ...s })) : [],
                    score: typeof data.score === 'string' || typeof data.score === 'number' ? data.score : null,
                    raw: typeof data.raw === 'string' ? data.raw : ''
                };
                // Deep clone to ensure no prototype issues
                const plainResults = JSON.parse(JSON.stringify(cleanResults));
                console.log('Clean results object:', plainResults, 'Type:', Object.prototype.toString.call(plainResults));
                this.safeSetState(prevState => ({
                    ...prevState,
                    results: plainResults,
                    refreshing: false
                }));
            } catch (err) {
                console.error('Error processing results:', err);
                this.safeSetState(prevState => ({
                    ...prevState,
                    results: null,
                    refreshing: false,
                    message: 'Error processing results',
                    messageType: 'error'
                }));
            }
        }).catch((err) => {
            console.error('Error fetching results:', err);
            this.safeSetState(prevState => ({
                ...prevState,
                refreshing: false
            }));
            this.handleError(err);
        });
    };

    // Utility: Export table data to CSV
    exportToCSV = (rows, filename) => {
        if (!Array.isArray(rows) || !rows.length) return;
        try {
            const header = Object.keys(rows[0]).filter(k => k !== 'id');
            const csv = [header.join(',')].concat(
                rows.map(row => header.map(k => '"' + (row[k] ? String(row[k]).replace(/"/g, '""') : '') + '"').join(','))
            ).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            FileSaver.saveAs(blob, filename);
        } catch (error) {
            console.error('Error exporting CSV:', error);
            this.setState({ message: 'Error exporting CSV', messageType: 'error' });
        }
    };

    // Utility: Copy table data to clipboard
    copyToClipboard = (rows) => {
        if (!Array.isArray(rows) || !rows.length) return;
        try {
            const header = Object.keys(rows[0]).filter(k => k !== 'id');
            const text = [header.join('\t')].concat(
                rows.map(row => header.map(k => row[k] || '').join('\t'))
            ).join('\n');
            navigator.clipboard.writeText(text);
            this.setState({ message: 'Copied to clipboard!', messageType: 'success' });
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            this.setState({ message: 'Error copying to clipboard', messageType: 'error' });
        }
    };

    // Utility: Update filter text safely
    updateFilterText = (index, value) => {
        const currentFilters = this.state.filterText || ['', ''];
        const newFilters = [...currentFilters];
        newFilters[index] = value;
        this.setState({ filterText: newFilters });
    };

    // Utility: Filter rows by search string
    filterRows = (rows, filter) => {
        if (!Array.isArray(rows)) return [];
        if (!filter) return rows;
        const f = filter.toLowerCase();
        return rows.filter(row => {
            if (!row || typeof row !== 'object') return false;
            return Object.values(row).some(val => val && String(val).toLowerCase().includes(f));
        });
    };

    // Safe table renderer with error handling
    renderTable = (data, columns, messagePrefix = '') => {
        try {
            if (!Array.isArray(data) || !data.length) {
                return <div>{messagePrefix} None</div>;
            }
            return (
                <Table
                    columns={columns}
                    data={data}
                    rowKey="id"
                />
            );
        } catch (error) {
            console.error('Error rendering table:', error);
            return <div style={{ color: 'red' }}>{messagePrefix} Error displaying data</div>;
        }
    };

    // Utility: Show details dialog for a row
    showDetails = (row) => {
        if (row && typeof row === 'object') {
            this.setState({ detailsRow: row });
        }
    };
    closeDetails = () => {
        this.setState({ detailsRow: null });
    };

    render() {
        try {
            // DEBUG: Check if Table is defined
            console.log('Table:', Table, 'typeof Table:', typeof Table);
            const { lynisInstalled, installing, running, results, message, messageType, refreshing, categories, skipTests, extraParams, detailsRow, loading } = this.state;

            // Show loading spinner while initializing
            if (loading) {
                return (
                    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
                        <Spinner>Loading Lynis Audit Interface...</Spinner>
                    </div>
                );
            }

            // Safely get filtering state
            const filterText = this.state.filterText || ['', ''];
            const warningFilter = filterText[0] || '';
            const suggestionFilter = filterText[1] || '';
            // Ensure unique, sanitized IDs and codes for all rows
            const sanitizeCode = code => (typeof code === 'string' ? code.replace(/^=+/, '').trim() : '');
            const warnings = results && Array.isArray(results.warnings)
                ? results.warnings.map((w, i) => {
                    const code = sanitizeCode(w.code);
                    const desc = typeof w.description === 'string' ? w.description.slice(0, 32) : '';
                    const rem = typeof w.remediation === 'string' ? w.remediation.slice(0, 32) : '';
                    return {
                        ...w,
                        code,
                        id: `warning-${code}-${desc}-${rem}-${i}`
                    };
                })
                : [];
            const suggestions = results && Array.isArray(results.suggestions)
                ? results.suggestions.map((s, i) => {
                    const code = sanitizeCode(s.code);
                    const desc = typeof s.description === 'string' ? s.description.slice(0, 32) : '';
                    const rem = typeof s.remediation === 'string' ? s.remediation.slice(0, 32) : '';
                    return {
                        ...s,
                        code,
                        id: `suggestion-${code}-${desc}-${rem}-${i}`
                    };
                })
                : [];
            const filteredWarnings = this.filterRows(warnings, warningFilter);
            const filteredSuggestions = this.filterRows(suggestions, suggestionFilter);

            // Fallback: If Table is undefined, render a plain HTML table for debugging
            const renderSafeTable = (data, columns, messagePrefix = '') => {
                if (!Array.isArray(data) || !data.length) {
                    return <div>{messagePrefix} None</div>;
                }
                if (!Table) {
                    // Fallback to plain HTML table
                    return (
                        <table border="1" style={{ width: '100%', margin: '8px 0' }}>
                            <thead>
                                <tr>
                                    {columns.map(col => <th key={col.key}>{col.title}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map(row => (
                                    <tr key={row.id}>
                                        {columns.map(col => <td key={col.key}>{col.render ? (col.render(row) || <span />) : (row[col.key] || <span />)}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    );
                }
                // Always return a valid React element from renderers
                return (
                    <Table
                        columns={columns.map(col => ({
                            ...col,
                            render: row => {
                                try {
                                    const val = col.render ? col.render(row) : row[col.key];
                                    return val === undefined || val === null ? <span /> : val;
                                } catch (e) {
                                    return <span />;
                                }
                            }
                        }))}
                        data={data}
                        rowKey="id"
                    />
                );
            };

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
                            {/* Options menu for customizing the scan */}
                            <div style={{ marginBottom: 16, border: '1px solid #ddd', padding: 12, borderRadius: 4, background: '#fafbfc' }}>
                                <h4>Scan Options</h4>
                                <div style={{ marginBottom: 8 }}>
                                    <label><b>Categories</b> (select one or more): </label>
                                    <select
                                        multiple
                                        value={categories ? categories.split(',').map(s => s.trim()).filter(Boolean) : []}
                                        onChange={e => {
                                            const options = Array.from(e.target.selectedOptions).map(o => o.value);
                                            this.setState({ categories: options.join(',') });
                                        }}
                                        style={{ width: 300, marginLeft: 8 }}
                                    >
                                        {Overview.LYNIS_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                    <label><b>Skip Tests</b> (select one or more): </label>
                                    <select
                                        multiple
                                        value={skipTests ? skipTests.split(',').map(s => s.trim()).filter(Boolean) : []}
                                        onChange={e => {
                                            const options = Array.from(e.target.selectedOptions).map(o => o.value);
                                            this.setState({ skipTests: options.join(',') });
                                        }}
                                        style={{ width: 400, marginLeft: 8 }}
                                    >
                                        {Overview.LYNIS_TESTS.map(test => (
                                            <option key={test.id} value={test.id}>{test.id} — {test.description}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                    <label><b>Extra Parameters</b>: </label>
                                    <input
                                        type="text"
                                        value={extraParams}
                                        onChange={e => this.setState({ extraParams: e.target.value.replace(/[;&|`$><]/g, '') })}
                                        style={{ width: 300, marginLeft: 8 }}
                                        placeholder="e.g. --quick --no-colors"
                                    />
                                </div>
                            </div>
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
                                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                            <input type="text" placeholder="Filter..." value={warningFilter} onChange={e => this.updateFilterText(0, e.target.value)} style={{ width: 200 }} />
                                            <Button onClick={() => this.exportToCSV(filteredWarnings, 'lynis-warnings.csv')} size="xs">Export CSV</Button>
                                            <Button onClick={() => this.copyToClipboard(filteredWarnings)} size="xs">Copy</Button>
                                        </div>
                                        {renderSafeTable(filteredWarnings, [
                                            { title: 'Code', key: 'code', render: row => row.code ? <a href={`https://cisofy.com/controls/${row.code}`} target="_blank" rel="noopener noreferrer">{row.code}</a> : <span /> },
                                            { title: 'Description', key: 'description', render: row => row.description || <span /> },
                                            { title: 'Remediation', key: 'remediation', render: row => row.remediation || <span /> },
                                            { title: 'Actions', key: 'actions', render: row => <Button size="xs" onClick={() => this.showDetails(row)}>Details</Button> },
                                        ])}
                                    </div>
                                    <div style={{ marginTop: 12 }}>
                                        <b>Suggestions:</b>
                                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                            <input type="text" placeholder="Filter..." value={suggestionFilter} onChange={e => this.updateFilterText(1, e.target.value)} style={{ width: 200 }} />
                                            <Button onClick={() => this.exportToCSV(filteredSuggestions, 'lynis-suggestions.csv')} size="xs">Export CSV</Button>
                                            <Button onClick={() => this.copyToClipboard(filteredSuggestions)} size="xs">Copy</Button>
                                        </div>
                                        {renderSafeTable(filteredSuggestions, [
                                            { title: 'Code', key: 'code', render: row => row.code ? <a href={`https://cisofy.com/controls/${row.code}`} target="_blank" rel="noopener noreferrer">{row.code}</a> : <span /> },
                                            { title: 'Description', key: 'description', render: row => row.description || <span /> },
                                            { title: 'Remediation', key: 'remediation', render: row => row.remediation || <span /> },
                                            { title: 'Actions', key: 'actions', render: row => <Button size="xs" onClick={() => this.showDetails(row)}>Details</Button> },
                                        ])}
                                    </div>
                                    {/* Details Dialog */}
                                    {detailsRow && (
                                        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={this.closeDetails}>
                                            <div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 400, maxWidth: 600 }} onClick={e => e.stopPropagation()}>
                                                <h4>Details</h4>
                                                <div><b>Code:</b> {detailsRow.code ? <a href={`https://cisofy.com/controls/${detailsRow.code}`} target="_blank" rel="noopener noreferrer">{detailsRow.code}</a> : 'N/A'}</div>
                                                <div style={{ marginTop: 8 }}><b>Description:</b> {detailsRow.description || 'N/A'}</div>
                                                <div style={{ marginTop: 8 }}><b>Remediation:</b> {detailsRow.remediation || 'N/A'}</div>
                                                <Button onClick={this.closeDetails} style={{ marginTop: 16 }}>Close</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        } catch (error) {
            console.error('Error in render:', error);
            return (
                <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
                    <Alert intent="error">
                        An error occurred while rendering the interface. Please check the console for details.
                    </Alert>
                </div>
            );
        }
    }
}
