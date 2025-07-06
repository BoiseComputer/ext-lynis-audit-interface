# Lynus Audit Interface for Plesk

This extension allows Plesk server administrators to run and review Lynis security audits directly from the Plesk interface.

## Features

- One-click Lynis installation (Debian/Ubuntu)
- Run Lynis security audits from the Plesk UI
- View parsed audit results: hardening index, warnings, suggestions
- Download/view raw Lynis report
- Admin-only access for all actions

## Getting Started

### Prerequisites

- PHP 8.0+
- [Composer](https://getcomposer.org)
- [Node.js](https://nodejs.org)
- [Yarn](https://yarnpkg.com)
- Server must support `apt-get` (Debian/Ubuntu)

### Installation

1. Install dependencies and compile assets:

    yarn install

2. Build the extension:

    yarn build

3. Create a .zip archive with the contents of the `/src` directory (except `/frontend` subdirectory).

4. Upload the archive via the Plesk Extension Catalog or use the [command line utility](https://docs.plesk.com/en-US/onyx/extensions-guide/extensions-management-utility.73617/).

### Usage

- Go to the "Lynus Audit Interface" section in the Plesk admin sidebar.
- Install Lynis if prompted.
- Run audits and review results.

## License

This project is licensed under the Apache License, Version 2.0 - see the [LICENSE](LICENSE) file for details.
