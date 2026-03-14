export default function PrivacyPage() {
  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',fontFamily:"'Inter',sans-serif"}}>
      <nav style={{background:'#fff',borderBottom:'1px solid #e5e7eb',padding:'0 2rem',height:60,display:'flex',alignItems:'center'}}>
        <a href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
          <img src="https://rkfkccefwlarscfjmncz.supabase.co/storage/v1/object/public/assets/Wht%20M%20Solid%20Blue%20Sq%20Clear%20Background.png" alt="Mainspring M" style={{width:36,height:36,borderRadius:8,display:'block'}} />
          <div>
            <div style={{fontSize:15,fontWeight:700,color:'#0f1f3d'}}>Builder Maturity</div>
            <span style={{fontSize:11,color:'#9ca3af',display:'block',lineHeight:1}}>The Mainspring Group</span>
          </div>
        </a>
      </nav>
      <div style={{maxWidth:760,margin:'0 auto',padding:'48px 24px 80px'}}>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:32,color:'#0f1f3d',marginBottom:8}}>Privacy Policy</h1>
        <p style={{fontSize:13,color:'#9ca3af',marginBottom:32}}>Last Updated: March 13, 2025</p>
        <div style={{fontSize:14,color:'#374151',lineHeight:1.8}}>
          <p style={{marginBottom:16}}>This Privacy Policy describes how The Mainspring Group, LLC (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses, and discloses your information when you use the Builder Maturity Assessment Service at buildermaturity.com.</p>
          <p style={{marginBottom:24}}><strong>Company:</strong> The Mainspring Group, LLC, 780 Newtown-Yardley Rd, Suite 310A, Newtown, PA 18940 &mdash; <a href="mailto:hello@themainspringgroup.com" style={{color:'#1d4ed8'}}>hello@themainspringgroup.com</a></p>

          <h2 style={{fontSize:16,fontWeight:700,color:'#0f1f3d',margin:'24px 0 8px'}}>Information We Collect</h2>
          <ul style={{marginLeft:20,marginBottom:16}}>
            <li style={{marginBottom:4}}>Email address, name, company name, and title</li>
            <li style={{marginBottom:4}}>Assessment responses and results</li>
            <li style={{marginBottom:4}}>Usage data (IP address, browser type, pages visited)</li>
            <li style={{marginBottom:4}}>Payment information (processed by Stripe &mdash; we never store card details)</li>
          </ul>

          <h2 style={{fontSize:16,fontWeight:700,color:'#0f1f3d',margin:'24px 0 8px'}}>How We Use Your Information</h2>
          <ul style={{marginLeft:20,marginBottom:16}}>
            <li style={{marginBottom:4}}>To provide and maintain the Service</li>
            <li style={{marginBottom:4}}>To manage your account and subscription</li>
            <li style={{marginBottom:4}}>To process payments via Stripe</li>
            <li style={{marginBottom:4}}>To send service-related communications</li>
            <li style={{marginBottom:4}}>To improve the Service using anonymized, aggregated data</li>
            <li style={{marginBottom:4}}>To comply with legal obligations</li>
          </ul>

          <h2 style={{fontSize:16,fontWeight:700,color:'#0f1f3d',margin:'24px 0 8px'}}>Third-Party Services</h2>
          <ul style={{marginLeft:20,marginBottom:16}}>
            <li style={{marginBottom:4}}><strong>Stripe</strong> &mdash; payment processing (<a href="https://stripe.com/us/privacy" style={{color:'#1d4ed8'}}>Privacy Policy</a>)</li>
            <li style={{marginBottom:4}}><strong>Supabase</strong> &mdash; data storage and authentication</li>
            <li style={{marginBottom:4}}><strong>Google Analytics</strong> &mdash; usage analytics (<a href="https://policies.google.com/privacy" style={{color:'#1d4ed8'}}>Privacy Policy</a>)</li>
            <li style={{marginBottom:4}}><strong>HubSpot</strong> &mdash; email communications (<a href="https://legal.hubspot.com/privacy-policy" style={{color:'#1d4ed8'}}>Privacy Policy</a>)</li>
          </ul>

          <h2 style={{fontSize:16,fontWeight:700,color:'#0f1f3d',margin:'24px 0 8px'}}>Cookies</h2>
          <p style={{marginBottom:16}}>We use session and persistent cookies for authentication, preferences, and analytics. You may disable cookies in your browser settings, though some features may not work properly.</p>

          <h2 style={{fontSize:16,fontWeight:700,color:'#0f1f3d',margin:'24px 0 8px'}}>Data Retention</h2>
          <p style={{marginBottom:16}}>We retain your data only as long as necessary for the purposes in this Policy or as required by law. You may request deletion at any time.</p>

          <h2 style={{fontSize:16,fontWeight:700,color:'#0f1f3d',margin:'24px 0 8px'}}>Your Rights</h2>
          <ul style={{marginLeft:20,marginBottom:16}}>
            <li style={{marginBottom:4}}>Access, correct, or delete your personal information</li>
            <li style={{marginBottom:4}}>Opt out of marketing communications</li>
            <li style={{marginBottom:4}}>Request data portability</li>
            <li style={{marginBottom:4}}>California residents have additional rights under CCPA/CPRA</li>
          </ul>
          <p style={{marginBottom:16}}>To exercise your rights, contact <a href="mailto:hello@themainspringgroup.com" style={{color:'#1d4ed8'}}>hello@themainspringgroup.com</a>.</p>

          <h2 style={{fontSize:16,fontWeight:700,color:'#0f1f3d',margin:'24px 0 8px'}}>Security</h2>
          <p style={{marginBottom:16}}>We use commercially reasonable means to protect your data. No method of internet transmission is 100% secure.</p>

          <h2 style={{fontSize:16,fontWeight:700,color:'#0f1f3d',margin:'24px 0 8px'}}>Children</h2>
          <p style={{marginBottom:16}}>Our Service is not directed to anyone under 13. We do not knowingly collect personal information from children under 13.</p>

          <h2 style={{fontSize:16,fontWeight:700,color:'#0f1f3d',margin:'24px 0 8px'}}>Changes</h2>
          <p style={{marginBottom:16}}>We may update this Policy periodically. We will notify you of material changes by posting the new Policy on this page.</p>

          <h2 style={{fontSize:16,fontWeight:700,color:'#0f1f3d',margin:'24px 0 8px'}}>Contact</h2>
          <p>Questions? Email <a href="mailto:hello@themainspringgroup.com" style={{color:'#1d4ed8'}}>hello@themainspringgroup.com</a> or write to 780 Newtown-Yardley Rd, Suite 310A, Newtown, PA 18940.</p>
        </div>
      </div>
    </div>
  )
}