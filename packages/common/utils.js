const address = require('address')
const chalk = require('chalk')
const { COLORS } = require('./constant')

function logServerInfo(port, name = 'Site') {
    const local = `http://localhost:${port}/`;
    const network = `http://${address.ip()}:${port}/`;

    console.log(`\n  ${name} running at:\n`);
    console.log(`  ${chalk.bold('Local')}:    ${chalk.hex(COLORS.green)(local)} `);
    console.log(`  ${chalk.bold('Network')}:  ${chalk.hex(COLORS.green)(network)}`);
}

module.exports = {
    logServerInfo,
}
