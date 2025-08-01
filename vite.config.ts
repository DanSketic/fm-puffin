import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        lib: {
            entry: 'src/main.ts',
            name: 'Puffin',
            fileName: 'main',
            formats: ['es']
        },
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            external: [], // ha vannak külső dep-ek, ide jöhetnek (pl. lodash)
        },
        target: 'esnext', // vagy 'es2015' ha régebbi böngészőket is támogatni kell
        minify: true
    }
})