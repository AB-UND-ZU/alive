const { spawnSync } = require('child_process');

// instead of launching React Dev Server, launch Rune pointing to React Dev Server
spawnSync('npm', ['run', 'rune:start', '--', process.argv[2]], { stdio: 'inherit' });