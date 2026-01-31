import React from 'react';
import './PerformanceStats.css';

const IconAffiliate = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stat-svg">
    <path d="M12 2a3 3 0 100 6 3 3 0 000-6zM4 8a3 3 0 100 6 3 3 0 000-6zM20 8a3 3 0 100 6 3 3 0 000-6z" fill="currentColor"/>
    <path d="M6 14c2 2 6 2 8 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const IconTriSync = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="stat-svg">
    <path d="M12 3v4M12 17v4M4.2 7.8L7 10.6M17 13.4l2.8 2.8M4.2 16.2L7 13.4M17 10.6L19.8 7.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="12" cy="11" r="2" fill="currentColor" />
  </svg>
);

const IconTrinity = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="stat-svg">
    <path d="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6z" fill="currentColor" />
  </svg>
);

const IconVault = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="stat-svg">
    <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" fill="none" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const IconMentor = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="stat-svg">
    <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20v-1a4 4 0 014-4h8a4 4 0 014 4v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const IconLegacy = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="stat-svg">
    <path d="M3 12h18M6 6l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const IconVCommerce = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="stat-svg">
    <path d="M3 6h18v2H3zM5 10h14v8a1 1 0 01-1 1H6a1 1 0 01-1-1v-8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M8 14h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Delta({value}){
  if (value == null) return null;
  const up = value >= 0;
  const abs = Math.abs(value).toFixed(1) + '%';
  return (
    <div className={`stat-delta ${up? 'up':'down'}`}>
      <span className="delta-arrow">{up? '▲' : '▼'}</span>
      <span className="delta-value">{abs}</span>
    </div>
  );
}

function Sparkline({data = []}){
  if (!data || data.length < 2) return null;
  const w = 80, h = 24, pad = 2;
  const min = Math.min(...data), max = Math.max(...data);
  const points = data.map((v,i)=>{
    const x = pad + (i/(data.length-1))*(w-pad*2);
    const y = pad + (1 - (v - min)/(max - min || 1))*(h-pad*2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg className="stat-spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PerformanceStats({ performanceData = {} }) {
  const sample = {
    directAffiliateCommission: '$320',
    directAffiliateDelta: 4.2,
    directAffiliateTrend: [20,22,24,28,30],

    triSyncEngine: 12,
    triSyncDelta: 2.5,
    triSyncTrend: [8,9,11,12,12],

    trinityStrike: 3,
    trinityDelta: 0.0,
    trinityTrend: [0,1,2,3,3],

    prestigeVault: '$1,200',
    prestigeDelta: 6.1,
    prestigeTrend: [800,900,1000,1100,1200],

    mentorsMilestone: '$450',
    mentorsDelta: 1.8,
    mentorsTrend: [300,320,350,400,450],

    legacyStream: '$95',
    legacyDelta: -0.4,
    legacyTrend: [100,98,97,96,95],

    vCommerce: 27,
    vCommerceDelta: 3.3,
    vCommerceTrend: [15,18,20,25,27],
  };

  const data = Object.keys(performanceData).length ? performanceData : sample;

  const goldStyle = {
    background: 'rgba(4, 12, 9, 0.82)',
    border: '1px solid rgba(212, 175, 55, 0.32)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.55)'
  };

  const overrideCss = `
  .pv-stats-grid .pv-stat-card {
    background: rgba(4, 12, 9, 0.82) !important;
    border: 1px solid rgba(212, 175, 55, 0.32) !important;
    box-shadow: 0 12px 32px rgba(0,0,0,0.55) !important;
    color: #fff !important;
  }
  .pv-stats-grid .pv-stat-card .stat-spark polyline { stroke: #d4af37 !important; }
  `;

  const METRICS = [
    { key: 'directAffiliateCommission', label: 'Direct Affiliate Commission', icon: <IconAffiliate />, valueKey: 'directAffiliateCommission', deltaKey: 'directAffiliateDelta', trendKey: 'directAffiliateTrend', valueClass: 'stat-value-green' },
    { key: 'triSyncEngine', label: 'Tri - Sync Engine (Pairing)', icon: <IconTriSync />, valueKey: 'triSyncEngine', deltaKey: 'triSyncDelta', trendKey: 'triSyncTrend', valueClass: 'stat-value-green' },
    { key: 'trinityStrike', label: 'Trinity Strike (3peat)', icon: <IconTrinity />, valueKey: 'trinityStrike', deltaKey: 'trinityDelta', trendKey: 'trinityTrend', valueClass: 'stat-value-gold' },
    { key: 'prestigeVault', label: 'Prestige Vault (6th Pair LPV)', icon: <IconVault />, valueKey: 'prestigeVault', deltaKey: 'prestigeDelta', trendKey: 'prestigeTrend', valueClass: 'stat-value-gold' },
    { key: 'mentorsMilestone', label: "The Mentor's Milestone", icon: <IconMentor />, valueKey: 'mentorsMilestone', deltaKey: 'mentorsDelta', trendKey: 'mentorsTrend', valueClass: 'stat-value-gold' },
    { key: 'legacyStream', label: 'Legacy Stream (Residuals)', icon: <IconLegacy />, valueKey: 'legacyStream', deltaKey: 'legacyDelta', trendKey: 'legacyTrend', valueClass: 'stat-value-gold' },
    { key: 'vCommerce', label: 'V - Commerce (Dropshipping)', icon: <IconVCommerce />, valueKey: 'vCommerce', deltaKey: 'vCommerceDelta', trendKey: 'vCommerceTrend', valueClass: 'stat-value-green' },
  ];

  return (
    <div className="pv-stats-grid">
      <style dangerouslySetInnerHTML={{__html: overrideCss}} />
      {METRICS.map((m) => (
        <div key={m.key} className="pv-stat-card pv-stat-card-gold" style={goldStyle}>
          <div className="stat-header">
            <span className={`stat-icon ${m.valueClass==='stat-value-gold' ? 'stat-icon-gold' : 'stat-icon-green'}`}>{m.icon}</span>
            <div className="stat-label">{m.label}</div>
            <div className="spacer" />
            <Delta value={data[m.deltaKey]} />
          </div>
          <div className="stat-row">
            <div className={`stat-value ${m.valueClass}`}>{data[m.valueKey] ?? 0}</div>
            <Sparkline data={data[m.trendKey]} />
          </div>
        </div>
      ))}
    </div>
  );
}

