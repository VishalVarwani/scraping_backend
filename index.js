const { spawn } = require('child_process');

// Paths to your scripts
const scripts = [
    './linkedin.js',
    './stepstone.js',
    './glassdoor.js',
    './indeed.js'
];

// Start each script
scripts.forEach((script) => {
    const process = spawn('node', [script]);

    process.stdout.on('data', (data) => {
        console.log(`[${script}] ${data}`);
    });

    process.stderr.on('data', (data) => {
        console.error(`[${script}] Error: ${data}`);
    });

    process.on('close', (code) => {
        console.log(`[${script}] Process exited with code ${code}`);
    });
});
