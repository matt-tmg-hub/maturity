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
        <p style={{fontSize:13,color:'#9ca3af',marginBottom:32}}>Last Updated: July 27, 2024</p>
        <div style={{fontSize:14,color:'#374151',lineHeight:1.8}}>

          <p style={{marginBottom:16}}>This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Builder Maturity Assessment Service and tells You about Your privacy rights and how the law protects You. We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy.</p>

          <p style={{marginBottom:8}}><strong>Company:</strong> The Mainspring Group, LLC, 780 Newtown-Yardley Rd, Suite 310A, Newtown, PA 18940</p>
          <p style={{marginBottom:24}}><strong>Contact:</strong> <a href="mailto:hello@themainspringgroup.com" style={{color:'#1d4ed8'}}>hello@themainspringgroup.com</a></p>

          <h2 style={{fontSize:16,fontWeight:700,color:'#0f1f3d',marginBottom:8,marginTop:24}}>Information We Collect</h2>
          <p style={{marginBottom:8}}>When you use our Service, we may collect:</p>
          <ul style={{marginLeft:20,marginBottom:16}}>
            <li style={{marginBottom:4}}>Email address, first and last name</li>
            <li style={{marginBottom:4}}>Company name, title, and role information</li>
            <li style={{marginBottom:4}}>Assessment responses and results</li>
            <li style={{marginBottom:4}}>Usage data (IP address, browser type, pages visited, time and date of visits)</li>
            <li style={{marginBottom:4}}>Payment information (processed securely by Stripe — we do not store card details)</li>
          </ul>

          <h2 style={{fontSize:16,fontWeight:700,color:'#0f1f3d',marginBottom:8,marginTop:24}}>How We Use Your Information</h2>
          <ul style={{marginLeft:20,marginBottom:16}}>
            <li style={{marginBottom:4}}>To provide and maintain the Service</li>
            <li style={{marginBottom:4}}>To manage your account and subscription</li>
            <li style={{marginBottom:4}}>To process payments through Stripe</li>
            <li style={{marginBottom:4}}>To send service-related communications</li>
            <li style={{marginBottom:4}}>To improve our Service using anonymized, aggregated data</li>
            <li style={{marginBottom:4}}>To comply with legal obligations</li>
          </ul>

          <h2 style={{fontSize:16,fontWeight:700,color:'#0f1f3d',marginBottom:8,marginTop:24}}>Third-Party Services</h2>
          <p style={{marginBottom:8}}>We use the following third-party services:</p>
          <ul style={{marginLeft:20,marginBottom:16}}>
            <li style={{marginBottom:4}}><strong>Stripe</strong> — payment processing. <a href="https://stripe.com/us/privacy" style={{color:'#1d4ed8'}}>Stripe Privacy Policy</a></li>
            <li style={{marginBottom:4}}><strong>Supabase</strong> — data storage and authentication</li>
            <li style={{marginBottom:4}}><strong>Google Analytics</strong> — usage analytics. <a href="https://policies.google.com/privacy" style={{color:'#1d4ed8'}}>Google Privacy Policy</a></li>
            <li style={{marginBottom:4}}><strong>HubSpot</strong> — email communications. <a href="https://legal.hubspot.com/privacy-policy" style={{color:'#1d4ed8'}}>HubSpot Privacy Policy</a></li>
          </ul>

          <h2 style={{fontSize:16,fontWeight:700,color:'#0f1f3d',marginBottom:8,marginTop:24}}>Cookies</h2>
          <p style={{marginBottom:16}}>We use session and persistent cookies to authenticate users, remember preferences, and analyze usage. You can instruct your browser to refuse cookies, though some parts of the Service may not function properly without them.</p>

          <h2 style={{fontSize:16,fontWeight:700,color:'#0f1f3d',marginBottom:8,marginTop:24}}>Data Retention</h2>
          <p style={{marginBottom:16}}>We retain your Personal Data only as long as necessary for the purposes set out in this Privacy Policy, or as required by law. You may request deletion of your data at any time by contacting us.</p>

          <h2 style={{fontSize:16,fontWeight:700,color:'#0f1f3d',marginBottom:8,marginTop:24}}>Your Rights</h2>
          <p style={{marginBottom:8}}>You have the right to:</p>
          <ul style={{marginLeft:20,marginBottom:16}}>
            <li style={{marginBottom:4}}>Access, correct, or delete your personal information</li>
            <li style={{marginBottom:4}}>Opt out of marketing communications</li>
            <li style={{marginBottom:4}}>Request data portability</li>
            <li style={{marginBottom:4}}>California residents have additional rights under CCPA/CPRA</li>
          </ul>
          <p style={{marginBottom:16}}>To exercise these rights, contact us at <a href="mailto:hello@themainspringgroup.com" style={{color:'#1d4ed8'}}>hello@themainspringgroup.com</a>.</p>

          <h2 style={{fontSize:16,fontWeight:700,color:'#0f1f3d',marginBottom:8,marginTop:24}}>Security</h2>
          <p style={{marginBottom:16}}>We use commercially reasonable means to protect your Personal Data. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>

          <h2 style={{fontSize:16,fontWeight:700,color:'#0f1f3d',marginBottom:8,marginTop:24}}>Children</h2>
          <p style={{marginBottom:16}}>Our Service does not address anyone under the age of 13. We do not knowingly collect personal information from children under 13.</p>

          <h2 style={{fontSize:16,fontWeight:700,color:'#0f1f3d',marginBottom:8,marginTop:24}}>Changes to This Policy</h2>
          <p style={{marginBottom:16}}>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &ldquo;Last Updated&rdquo; date.</p>

          <h2 style={{fontSize:16,fontWeight:700,color:'#0f1f3d',marginBottom:8,marginTop:24}}>Contact Us</h2>
          <p>Questions about this Privacy Policy? Contact us at <a href="mailto:hello@themainspringgroup.com" style={{color:'#1d4ed8'}}>hello@themainspringgroup.com</a> or 780 Newtown-Yardley Rd, Suite 310A, Newtown, PA 18940. You may also visit <a href="https://themainspringgroup.com/about-us" style={{color:'#1d4ed8'}}>themainspringgroup.com/about-us</a>.</p>

        </div>
      </div>
    </div>
  )
}