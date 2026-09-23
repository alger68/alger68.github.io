import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
export default defineConfig({root:'frontend',base:'/power-design-360/',publicDir:'../public',resolve:{alias:{'@':path.resolve(import.meta.dirname)}},plugins:[react()],css:{postcss:path.resolve(import.meta.dirname)},build:{outDir:'../dist-pages',emptyOutDir:true}});
