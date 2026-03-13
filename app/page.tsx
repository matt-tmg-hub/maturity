 "use client";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const domains = [
    { icon: "🏢", title: "Org Structure", description: "Evaluate how your company is organized, who owns decisions, and whether your leadership team has the clarity to scale." },
    { icon: "🤝", title: "Customer Experience", description: "Measure how consistently you deliver a great buyer journey — from first contact through warranty and beyond." },
    { icon: "🔨", title: "Trade Partner", description: "Assess how well you recruit, onboard, manage, and retain the trade partners that build your homes." },
    { icon: "⚙️", title: "Internal Operations", description: "Examine your processes, workflows, and systems for scheduling, field management, and cost control." },
    { icon: "👷", title: "Builder Rep", description: "Assess how your field managers and superintendents engage customers and trade partners throughout construction — from pre-con through closing, scheduling, quality, and payment approval." },
    { icon: "💻", title: "Supporting Systems", description: "Review the technology stack and data practices that support your operations and decision-making." },
  ];

  const steps = [
    { number: "01", title: "Take the Assessment", description: "Answer 53 targeted questions across 6 operational domains. Takes about 20–30 minutes." },
    { number: "02", title: "Get Your Score", description: "Instantly see your maturity level across every domain, with an overall score out of 100." },
    { number: "03", title: "Follow Your Roadmap", description: "Receive AI-powered, prioritized recommendations tailored to where your business actually is today." },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#f9fafb", minHeight: "100vh", color: "#0f1f3d", margin: 0, padding: 0 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        a { text-decoration: none; color: inherit; }
      `}</style>

      <nav style={{ position: "sticky", top: 0, zIndex: 100, height: 60, backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, backgroundColor: "#0f1f3d", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="5,82 18,82 38,18 25,18" fill="white"/><polygon points="25,18 38,18 30,42 17,42" fill="white"/><polygon points="17,42 30,42 43,82 30,82" fill="white"/><polygon points="48,82 61,82 50,42 37,42" fill="white"/><polygon points="37,42 50,42 62,18 49,18" fill="white"/><polygon points="49,18 62,18 87,82 87,74 70,74 78,55 66,55 55,82 74,82" fill="white"/></svg>
            </div>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, fontWeight: 400, color: "#0f1f3d", lineHeight: 1.1 }}>Builder Maturity</div>
            <div style={{ fontSize: 10, color: "#6b7280", lineHeight: 1 }}>by The Mainspring Group</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/login")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#374151", padding: "8px 16px", borderRadius: 8 }}>Sign In</button>
          <button onClick={() => router.push("/pricing")} style={{ backgroundColor: "#0f1f3d", color: "#ffffff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, padding: "9px 20px", borderRadius: 9 }}>Get Started</button>
        </div>
      </nav>

      <section style={{ backgroundColor: "#0f1f3d", padding: "96px 24px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", backgroundColor: "#f59e0b", opacity: 0.07, filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 240, height: 240, borderRadius: "50%", backgroundColor: "#f59e0b", opacity: 0.06, filter: "blur(50px)" }} />
        <div style={{ position: "relative", maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "inline-block", backgroundColor: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: 99, padding: "5px 16px", fontSize: 12, fontWeight: 600, color: "#f59e0b", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 24 }}>Operational Maturity for Homebuilders</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(36px, 6vw, 62px)", fontWeight: 400, color: "#ffffff", lineHeight: 1.15, marginBottom: 24 }}>
            Find out exactly where{" "}<span style={{ color: "#f59e0b", fontStyle: "italic" }}>your building company</span>{" "}stands — and what to do next.
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px" }}>Builder Maturity is the only assessment built specifically for residential homebuilders. 53 questions. 6 domains. One clear roadmap.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/pricing")} style={{ backgroundColor: "#f59e0b", color: "#0f1f3d", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 700, padding: "14px 32px", borderRadius: 9 }}>Take the Assessment →</button>
            <button onClick={() => router.push("/login")} style={{ backgroundColor: "transparent", color: "#ffffff", border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 15, fontWeight: 500, padding: "14px 28px", borderRadius: 9 }}>Sign In</button>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb", padding: "18px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 40px" }}>
          {[{ value: "53", label: "Questions" }, { value: "6", label: "Domains" }, { value: "5", label: "Maturity Levels" }, { value: "AI", label: "Powered Recommendations" }, { value: "PDF", label: "Export Included" }].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#0f1f3d" }}>{item.value}</span>
              <span style={{ fontSize: 14, color: "#6b7280" }}>{item.label}</span>
              <span style={{ color: "#e5e7eb", marginLeft: 4 }}>·</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "80px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 400, color: "#0f1f3d", marginBottom: 12 }}>How it works</h2>
          <p style={{ fontSize: 16, color: "#6b7280", maxWidth: 480, margin: "0 auto" }}>Go from uncertainty to a clear operational roadmap in under 30 minutes.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {steps.map((step) => (
            <div key={step.number} style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 28 }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42, color: "#f59e0b", fontWeight: 400, lineHeight: 1, marginBottom: 16 }}>{step.number}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f1f3d", marginBottom: 10 }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65 }}>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ backgroundColor: "#ffffff", padding: "80px 24px", borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 400, color: "#0f1f3d", marginBottom: 12 }}>Six domains. Complete clarity.</h2>
            <p style={{ fontSize: 16, color: "#6b7280", maxWidth: 520, margin: "0 auto" }}>The assessment covers every critical area of a modern homebuilding operation — nothing is left out.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {domains.map((domain) => (
              <div key={domain.title} style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 14, padding: 28 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{domain.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f1f3d", marginBottom: 8 }}>{domain.title}</h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65 }}>{domain.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "80px 24px", maxWidth: 820, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 400, color: "#0f1f3d", marginBottom: 12 }}>Simple, transparent pricing</h2>
          <p style={{ fontSize: 16, color: "#6b7280" }}>Choose the plan that fits how you work.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          <div style={{ backgroundColor: "#ffffff", border: "2px solid #0f1f3d", borderRadius: 14, padding: 32, position: "relative" }}>
            <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", backgroundColor: "#f59e0b", color: "#0f1f3d", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 14px", borderRadius: 99 }}>Best Value</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42, color: "#0f1f3d", marginBottom: 4 }}>$249</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>per year</div>
            <p style={{ fontSize: 14, color: "#374151", marginBottom: 20, lineHeight: 1.6 }}>Unlimited assessments for your whole team. Full editing and PDF exports included.</p>
            <ul style={{ listStyle: "none", marginBottom: 28 }}>
              {["Unlimited assessments", "Edit & re-run assessments any time", "Full PDF export with AI recommendations", "Dashboard with historical tracking", "Priority support"].map((f) => (
                <li key={f} style={{ fontSize: 14, color: "#374151", padding: "5px 0", display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span> {f}</li>
              ))}
            </ul>
            <button onClick={() => router.push("/pricing")} style={{ backgroundColor: "#0f1f3d", color: "#ffffff", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 700, padding: "13px 0", borderRadius: 9, width: "100%" }}>Get Annual Access</button>
          </div>
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 32 }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42, color: "#0f1f3d", marginBottom: 4 }}>$149</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>one-time payment</div>
            <p style={{ fontSize: 14, color: "#374151", marginBottom: 20, lineHeight: 1.6 }}>Run a single assessment right now. No subscription required.</p>
            <ul style={{ listStyle: "none", marginBottom: 28 }}>
              {["1 full 53-question assessment", "AI-powered recommendations report", "PDF export", "No subscription needed"].map((f) => (
                <li key={f} style={{ fontSize: 14, color: "#374151", padding: "5px 0", display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span> {f}</li>
              ))}
            </ul>
            <button onClick={() => router.push("/pricing")} style={{ backgroundColor: "transparent", color: "#0f1f3d", border: "2px solid #0f1f3d", cursor: "pointer", fontSize: 15, fontWeight: 700, padding: "13px 0", borderRadius: 9, width: "100%" }}>Buy Single Assessment</button>
          </div>
        </div>
        <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af", marginTop: 24 }}>Payments secured by Stripe. Cancel annual plan any time.</p>
      </section>

      <footer style={{ backgroundColor: "#0f1f3d", padding: "36px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 28, height: 28, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="5,82 18,82 38,18 25,18" fill="white"/><polygon points="25,18 38,18 30,42 17,42" fill="white"/><polygon points="17,42 30,42 43,82 30,82" fill="white"/><polygon points="48,82 61,82 50,42 37,42" fill="white"/><polygon points="37,42 50,42 62,18 49,18" fill="white"/><polygon points="49,18 62,18 87,82 87,74 70,74 78,55 66,55 55,82 74,82" fill="white"/></svg>
          </div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14, color: "#ffffff" }}>Builder Maturity</span>
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 16 }}>by The Mainspring Group</p>
        <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
          <a href="/pricing" style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Pricing</a>
          <a href="/login" style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Sign In</a>
        </div>
      </footer>
    </div>
  );
}"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const domains = [
    { icon: "ð¢", title: "Org Structure", description: "Evaluate how your company is organized, who owns decisions, and whether your leadership team has the clarity to scale." },
    { icon: "ð·", title: "Customer Experience", description: "Measure how consistently you deliver a great buyer journey â from first contact through warranty and beyond." },
    { icon: "ð¨", title: "Trade Partner", description: "Assess how well you recruit, onboard, manage, and retain the trade partners that build your homes." },
    { icon: "âï¸", title: "Internal Operations", description: "Examine your processes, workflows, and systems for scheduling, field management, and cost control." },
    { icon: "ð·", title: "Builder Rep", description: "Assess how your field managers and superintendents engage customers and trade partners throughout construction â from pre-con through closing, scheduling, quality, and payment approval." },
    { icon: "ð»", title: "Supporting Systems", description: "Review the technology stack and data practices that support your operations and decision-making." },
  ];

  const steps = [
    { number: "01", title: "Take the Assessment", description: "Answer 53 targeted questions across 6 operational domains. Takes about 20â30 minutes." },
    { number: "02", title: "Get Your Score", description: "Instantly see your maturity level across every domain, with an overall score out of 100." },
    { number: "03", title: "Follow Your Roadmap", description: "Receive AI-powered, prioritized recommendations tailored to where your business actually is today." },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#f9fafb", minHeight: "100vh", color: "#0f1f3d", margin: 0, padding: 0 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        a { text-decoration: none; color: inherit; }
      `}</style>

      <nav style={{ position: "sticky", top: 0, zIndex: 100, height: 60, backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, backgroundColor: "#0f1f3d", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="5,82 18,82 38,18 25,18" fill="white"/><polygon points="25,18 38,18 30,42 17,42" fill="white"/><polygon points="17,42 30,42 43,82 30,82" fill="white"/><polygon points="48,82 61,82 50,42 37,42" fill="white"/><polygon points="37,42 50,42 62,18 49,18" fill="white"/><polygon points="49,18 62,18 87,82 87,74 70,74 78,55 66,55 55,82 74,82" fill="white"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, fontWeight: 400, color: "#0f1f3d", lineHeight: 1.1 }}>Builder Maturity</div>
            <div style={{ fontSize: 10, color: "#6b7280", lineHeight: 1 }}>by The Mainspring Group</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/login")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#374151", padding: "8px 16px", borderRadius: 8 }}>Sign In</button>
          <button onClick={() => router.push("/pricing")} style={{ backgroundColor: "#0f1f3d", color: "#ffffff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, padding: "9px 20px", borderRadius: 9 }}>Get Started</button>
        </div>
      </nav>

      <section style={{ backgroundColor: "#0f1f3d", padding: "96px 24px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", backgroundColor: "#f59e0b", opacity: 0.07, filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 240, height: 240, borderRadius: "50%", backgroundColor: "#f59e0b", opacity: 0.06, filter: "blur(50px)" }} />
        <div style={{ position: "relative", maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "inline-block", backgroundColor: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: 99, padding: "5px 16px", fontSize: 12, fontWeight: 600, color: "#f59e0b", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 24 }}>Operational Maturity for Homebuilders</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(36px, 6vw, 62px)", fontWeight: 400, color: "#ffffff", lineHeight: 1.15, marginBottom: 24 }}>
            Find out exactly where{" "}<span style={{ color: "#f59e0b", fontStyle: "italic" }}>your building company</span>{" "}stands â and what to do next.
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px" }}>Builder Maturity is the only assessment built specifically for residential homebuilders. 53 questions. 6 domains. One clear roadmap.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/pricing")} style={{ backgroundColor: "#f59e0b", color: "#0f1f3d", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 700, padding: "14px 32px", borderRadius: 9 }}>Take the Assessment â</button>
            <button onClick={() => router.push("/login")} style={{ backgroundColor: "transparent", color: "#ffffff", border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 15, fontWeight: 500, padding: "14px 28px", borderRadius: 9 }}>Sign In</button>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb", padding: "18px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 40px" }}>
          {[{ value: "53", label: "Questions" }, { value: "6", label: "Domains" }, { value: "5", label: "Maturity Levels" }, { value: "AI", label: "Powered Recommendations" }, { value: "PDF", label: "Export Included" }].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#0f1f3d" }}>{item.value}</span>
              <span style={{ fontSize: 14, color: "#6b7280" }}>{item.label}</span>
              <span style={{ color: "#e5e7eb", marginLeft: 4 }}>Â·</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "80px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 400, color: "#0f1f3d", marginBottom: 12 }}>How it works</h2>
          <p style={{ fontSize: 16, color: "#6b7280", maxWidth: 480, margin: "0 auto" }}>Go from uncertainty to a clear operational roadmap in under 30 minutes.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {steps.map((step) => (
            <div key={step.number} style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 28 }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42, color: "#f59e0b", fontWeight: 400, lineHeight: 1, marginBottom: 16 }}>{step.number}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f1f3d", marginBottom: 10 }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65 }}>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ backgroundColor: "#ffffff", padding: "80px 24px", borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 400, color: "#0f1f3d", marginBottom: 12 }}>Six domains. Complete clarity.</h2>
            <p style={{ fontSize: 16, color: "#6b7280", maxWidth: 520, margin: "0 auto" }}>The assessment covers every critical area of a modern homebuilding operation â nothing is left out.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {domains.map((domain) => (
              <div key={domain.title} style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 14, padding: 28 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{domain.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f1f3d", marginBottom: 8 }}>{domain.title}</h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65 }}>{domain.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "80px 24px", maxWidth: 820, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 400, color: "#0f1f3d", marginBottom: 12 }}>Simple, transparent pricing</h2>
          <p style={{ fontSize: 16, color: "#6b7280" }}>Choose the plan that fits how you work.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          <div style={{ backgroundColor: "#ffffff", border: "2px solid #0f1f3d", borderRadius: 14, padding: 32, position: "relative" }}>
            <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", backgroundColor: "#f59e0b", color: "#0f1f3d", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 14px", borderRadius: 99 }}>Best Value</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42, color: "#0f1f3d", marginBottom: 4 }}>$249</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>per year</div>
            <p style={{ fontSize: 14, color: "#374151", marginBottom: 20, lineHeight: 1.6 }}>Unlimited assessments for your whole team. Full editing and PDF exports included.</p>
            <ul style={{ listStyle: "none", marginBottom: 28 }}>
              {["Unlimited assessments", "Edit & re-run assessments any time", "Full PDF export with AI recommendations", "Dashboard with historical tracking", "Priority support"].map((f) => (
                <li key={f} style={{ fontSize: 14, color: "#374151", padding: "5px 0", display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "#16a34a", fontWeight: 700 }}>â</span> {f}</li>
              ))}
            </ul>
            <button onClick={() => router.push("/pricing")} style={{ backgroundColor: "#0f1f3d", color: "#ffffff", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 700, padding: "13px 0", borderRadius: 9, width: "100%" }}>Get Annual Access</button>
          </div>
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 32 }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42, color: "#0f1f3d", marginBottom: 4 }}>$149</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>one-time payment</div>
            <p style={{ fontSize: 14, color: "#374151", marginBottom: 20, lineHeight: 1.6 }}>Run a single assessment right now. No subscription required.</p>
            <ul style={{ listStyle: "none", marginBottom: 28 }}>
              {["1 full 53-question assessment", "AI-powered recommendations report", "PDF export", "No subscription needed"].map((f) => (
                <li key={f} style={{ fontSize: 14, color: "#374151", padding: "5px 0", display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "#16a34a", fontWeight: 700 }}>â</span> {f}</li>
              ))}
            </ul>
            <button onClick={() => router.push("/pricing")} style={{ backgroundColor: "transparent", color: "#0f1f3d", border: "2px solid #0f1f3d", cursor: "pointer", fontSize: 15, fontWeight: 700, padding: "13px 0", borderRadius: 9, width: "100%" }}>Buy Single Assessment</button>
          </div>
        </div>
        <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af", marginTop: 24 }}>Payments secured by Stripe. Cancel annual plan any time.</p>
      </section>

      <footer style={{ backgroundColor: "#0f1f3d", padding: "36px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 28, height: 28, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="5,82 18,82 38,18 25,18" fill="white"/><polygon points="25,18 38,18 30,42 17,42" fill="white"/><polygon points="17,42 30,42 43,82 30,82" fill="white"/><polygon points="48,82 61,82 50,42 37,42" fill="white"/><polygon points="37,42 50,42 62,18 49,18" fill="white"/><polygon points="49,18 62,18 87,82 87,74 70,74 78,55 66,55 55,82 74,82" fill="white"/></svg>
          </div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14, color: "#ffffff" }}>Builder Maturity</span>
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 16 }}>by The Mainspring Group</p>
        <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
          <a href="/pricing" style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Pricing</a>
          <a href="/login" style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Sign In</a>
        </div>
      </footer>
    </div>
  );
      }
