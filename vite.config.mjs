import {defineConfig} from 'vite'; export default defineConfig({root:'source/pep-html',publicDir:'../../public',build:{outDir:'../../dist',emptyOutDir:true},assetsInclude:['**/*.glb']});
