export default function DashboardBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div
        className="absolute w-[700px] h-[700px] rounded-full blur-[180px]"
        style={{
          background: "var(--neon-blue)",
          top: "10%",
          left: "-10%",
          opacity: 0.15,
          animation: "dashPulse1 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[160px]"
        style={{
          background: "var(--neon-green)",
          bottom: "0%",
          right: "-10%",
          opacity: 0.12,
          animation: "dashPulse2 10s ease-in-out infinite",
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[140px]"
        style={{
          background: "var(--neon-purple)",
          top: "50%",
          left: "40%",
          transform: "translate(-50%, -50%)",
          opacity: 0.08,
          animation: "dashPulse3 12s ease-in-out infinite",
        }}
      />
    </div>
  );
}
