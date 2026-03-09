import Link from "next/link";

export default function TrainingCreatePage() {
  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit', sans-serif", color: "#F0F0F5" }}>
      <div style={{ fontSize: 48, marginBottom: 24 }}>🎓</div>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: "#E9C46A", marginBottom: 12 }}>연수 세션 생성</h1>
      <p style={{ color: "#606070", fontSize: 18, marginBottom: 32 }}>준비 중</p>
      <Link href="/" style={{ color: "#E9C46A", textDecoration: "none", fontSize: 15, border: "1px solid #E9C46A", padding: "10px 28px", borderRadius: 8 }}>
        ← 랜딩페이지로 돌아가기
      </Link>
    </div>
  );
}
