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
          <img src="https://rkfkccefwlarscfjmncz.supabase.co/storage/v1/object/public/assets/Wht_M_Solid_Blue_Sq_Clear_Background.png" alt="Mainspring M" style={{ width: 36, height: 36, borderRadius: 8 }} />
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
            Find out exactly where{" "}<span style={{ color: "#f59e0b", fontStyle: "italic" }}>your building company</span>{" "}stands &mdash; and what to do next.
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px" }}>Builder Maturity is the only assessment built specifically for residential homebuilders. 53 questions. 6 domains. One clear roadmap.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/pricing")} style={{ backgroundColor: "#f59e0b", color: "#0f1f3d", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 700, padding: "14px 32px", borderRadius: 9 }}>Take the Assessment &rarr;</button>
            <button onClick={() => router.push("/login")} style={{ backgroundColor: "transparent", color: "#ffffff", border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 15, fontWeight: 500, padding: "14px 28px", borderRadius: 9 }}>Sign In</button>
          </div>
        </div>
      </section>
