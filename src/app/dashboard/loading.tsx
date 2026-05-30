export default function DashboardLoading() {
  const skeletonCard = (key: number) => (
    <div className="commitment-card" key={key} style={{ padding: "12px", gap: "8px" }}>
      <div className="card-title-row" style={{ gap: "8px" }}>
        <div className="skeleton" style={{ width: "16px", height: "16px", borderRadius: "50%" }} />
        <div>
          <div className="skeleton" style={{ width: "48px", height: "16px", borderRadius: "999px" }} />
          <div className="skeleton" style={{ width: "120px", height: "14px", marginTop: "4px" }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: "80%", height: "12px" }} />
      <div className="skeleton" style={{ width: "60%", height: "12px" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}>
        <div className="skeleton" style={{ height: "28px" }} />
        <div className="skeleton" style={{ height: "28px" }} />
        <div className="skeleton" style={{ height: "28px" }} />
      </div>
      <div className="skeleton" style={{ width: "82px", height: "32px", borderRadius: "var(--radius)" }} />
    </div>
  );

  return (
    <main className="page-shell dashboard-shell">
      <section className="page-heading">
        <div>
          <p className="eyebrow">看板</p>
          <h1>今天的承诺</h1>
          <p className="heading-note">优先处理今日到期和已逾期项，再按责任方向查看后续跟进。</p>
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="digest-card">
          <div>
            <p className="eyebrow">加载中</p>
            <div className="skeleton" style={{ width: "280px", height: "22px", marginTop: "6px" }} />
            <div className="skeleton" style={{ width: "180px", height: "14px", marginTop: "8px" }} />
          </div>
          <div className="digest-metrics">
            <span>
              <div className="skeleton" style={{ width: "32px", height: "32px", borderRadius: "50%", margin: "0 auto" }} />
              <div className="skeleton" style={{ width: "24px", height: "11px", margin: "4px auto 0" }} />
            </span>
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i}>
                <div className="skeleton" style={{ width: "32px", height: "20px", margin: "0 auto" }} />
                <div className="skeleton" style={{ width: "24px", height: "11px", margin: "4px auto 0" }} />
              </span>
            ))}
          </div>
        </section>
      </div>
      <div className="board-grid">
        {Array.from({ length: 6 }).map((_, colIdx) => (
          <section className="board-column" key={colIdx}>
            <header>
              <div>
                <div className="skeleton" style={{ width: "64px", height: "18px" }} />
                <div className="skeleton" style={{ width: "96px", height: "13px", marginTop: "4px" }} />
              </div>
              <div className="skeleton" style={{ width: "28px", height: "28px", borderRadius: "999px" }} />
            </header>
            <div className="card-stack">
              {Array.from({ length: colIdx < 2 ? 2 : 1 }).map((_, i) => skeletonCard(colIdx * 10 + i))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
