import { execSync } from 'node:child_process';

try {
    const trackedFiles = execSync('git ls-files', { encoding: 'utf-8' })
        .split('\n')
        .map(f => f.trim())
        .filter(Boolean);

    const forbidden = trackedFiles.filter(file => {
        if (file === '.env.example') return false;
        return file === '.env' || file.startsWith('.env.') || file.endsWith('/.env');
    });

    if (forbidden.length > 0) {
        console.error('\x1b[31m[SECURITY FAILURE] The following secret environment files are tracked in git:\x1b[0m');
        forbidden.forEach(f => console.error(`  - ${f}`));
        console.error('Run: git rm --cached <file> and ensure it is in .gitignore');
        process.exit(1);
    }

    console.log('\x1b[32m[security] No secret env files are tracked in git.\x1b[0m');
    process.exit(0);
} catch (error) {
    console.error('[security] Error checking tracked files:', error.message);
    process.exit(1);
}
