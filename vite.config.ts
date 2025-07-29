import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        lib: {
            entry: 'src/main.ts',
            name: 'Puffin',
            fileName: 'main',
            formats: ['es', 'umd']
        },
        outDir: 'dist',
        rollupOptions: {
            external: [], // ha vannak külső dep-ek, ide jöhetnek (pl. lodash)
        },
        target: 'es2017',
        minify: true
    }
})