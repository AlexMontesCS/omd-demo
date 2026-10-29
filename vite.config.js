import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const omd = JSON.parse(readFileSync(new URL('./node_modules/@teachinglab/omd/package.json', import.meta.url), 'utf8'));

export default defineConfig({
    define: {
        __OMD_VERSION__: JSON.stringify(omd.version),
    },
    build: {
        chunkSizeWarningLimit: 2000,
    },
});
