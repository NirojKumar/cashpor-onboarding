export const ROLE = { HRSM: ['HRSM', 'HRSM'], RM: ['RM / DRM', 'RM / DRM'], HO: ['HO Recruitment Team', 'HO भर्ती टीम'], ADMIN: ['Developer / Admin', 'डेवलपर / एडमिन'] };
export const RL = (r, hi) => (ROLE[r] || [r, r])[hi ? 1 : 0];
export const STATUS = { submitted: ['With HRSM', 'HRSM के पास', 'warn'], hr_approved: ['With RM / DRM', 'RM / DRM के पास', 'warn'], rm_approved: ['With HO Recruitment', 'HO भर्ती टीम के पास', 'warn'], completed: ['Completed', 'पूर्ण', 'ok'], rejected: ['Rejected', 'अस्वीकृत', 'bad'] };
export const STATUS_FOR = { HRSM: 'submitted', RM: 'hr_approved', HO: 'rm_approved' };
export const HO_FIELDS = ['assess.rcs', '@staffid'];   // Employee ID and RCS No. are filled only by the HO Recruitment Team
export const short = v => { v = String(v ?? ''); if (v.startsWith('[{')) { try { return JSON.parse(v).map(f => f.name).join(', '); } catch { /* not a file list */ } } return v.length > 80 ? v.slice(0, 80) + '…' : v || '—'; };
