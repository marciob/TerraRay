export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-6 py-12 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <p className="text-sm font-medium tracking-wide text-emerald-600">
          Rayls Hackathon · Brazil Agri Credit
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Multi-farmer ERC-4626 vaults for Brazilian agriculture
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          This frontend walks through the full credit lifecycle: underwriting a farmer,
          funding a loan through a Rayls-powered vault, investor deposits, and on-chain
          repayments that update yield.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <a
          href="/operator/farmers/new"
          className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-500/70 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Operator – Underwrite &amp; Approve
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Simulate AI-driven underwriting and register a farmer into the on-chain
            registry with chosen risk tier and credit limits.
          </p>
          <ul className="mt-4 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            <li>• Flow A – Farmer onboarding and approval</li>
            <li>• Flow B – Create and fund a new note from a vault</li>
            <li>• Flow D – Record repayments and see updated TVL</li>
          </ul>
        </a>

        <a
          href="/investor/vaults"
          className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-500/70 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Investor – Vault Explorer
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Browse three predefined vaults, review their risk bands and crop exposure,
            and simulate a deposit into a diversified pool.
          </p>
          <ul className="mt-4 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            <li>• Flow C – Deposit into vaults and see your position</li>
            <li>• Demo-safe: all data is mocked, no real chain calls yet</li>
          </ul>
        </a>
      </section>
    </main>
  );
}
