import readline from 'node:readline';

const interactive = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
  });

  const goodbyeAndExit = () => {
    process.stdout.write('Goodbye!\n');
    process.exit(0);
  };

  const handleCommand = (line) => {
    const cmd = String(line ?? '').trim();

    switch (cmd) {
      case 'uptime': {
        const seconds = process.uptime().toFixed(2);
        process.stdout.write(`Uptime: ${seconds}s\n`);
        break;
      }
      case 'cwd': {
        process.stdout.write(`${process.cwd()}\n`);
        break;
      }
      case 'date': {
        process.stdout.write(`${new Date().toISOString()}\n`);
        break;
      }
      case 'exit': {
        goodbyeAndExit();
        return;
      }
      case '': {
        break;
      }
      default: {
        process.stdout.write('Unknown command\n');
      }
    }

    rl.prompt();
  };

  rl.on('line', handleCommand);
  rl.on('SIGINT', goodbyeAndExit);
  rl.on('close', goodbyeAndExit);

  rl.prompt();
};

interactive();
