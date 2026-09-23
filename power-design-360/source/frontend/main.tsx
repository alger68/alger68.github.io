import React from 'react';
import {createRoot} from 'react-dom/client';
import {Workbench} from '../components/power/workbench';
import '../app/globals.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><Workbench apiBase={(import.meta.env.VITE_POWER_API_BASE ?? 'https://power-design-360.ifluit.chatgpt.site').replace(/\/$/,'')}/></React.StrictMode>);
