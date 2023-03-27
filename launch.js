const { spawnSync } = require('child_process');

// instead of launching React Dev Server, launch Rune pointing to React Dev Server
spawnSync('npm', ['run', 'start:rune', '--', process.argv[2]], { stdio: 'inherit' });