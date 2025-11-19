//app/investor/vaults/[vaultId]/page.tsx
"use client";

import { notFound, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  Wallet,
  TrendingUp,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseUnits, formatUnits } from "viem";
import { useDemo } from "@/app/lib/demo-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CONTRACT_ADDRESSES,
  AGRO_VAULT_ABI,
  MOCK_STABLECOIN_ABI,
} from "@/app/lib/contracts";

// Mock data for the chart
const chartData = [
  { month: "Jan", realized: 10, projected: 10.2 },
  { month: "Feb", realized: 12, projected: 12.5 },
  { month: "Mar", realized: 11.5, projected: 13.0 },
  { month: "Apr", realized: 13.8, projected: 14.1 },
  { month: "May", realized: 14.2, projected: 14.5 },
  { month: "Jun", realized: 14.9, projected: 15.2 },
  { month: "Jul", realized: 15.5, projected: 15.8 },
];

export default function VaultDetailPage() {
  const params = useParams<{ vaultId: string }>();
  const { vaults, notes, positions } = useDemo();
  const { address, isConnected } = useAccount();
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [approvalPending, setApprovalPending] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const vaultId = decodeURIComponent(params.vaultId);
  const vault = vaults.find((candidate) => candidate.id === vaultId);

  // Contract reads
  const { data: usdcBalance, error: usdcError } = useReadContract({
    address: CONTRACT_ADDRESSES.MockStablecoin,
    abi: MOCK_STABLECOIN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: allowance, error: allowanceError } = useReadContract({
    address: CONTRACT_ADDRESSES.MockStablecoin,
    abi: MOCK_STABLECOIN_ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACT_ADDRESSES.AgroVault] : undefined,
    query: { enabled: !!address },
  });

  const { data: vaultShares, error: sharesError } = useReadContract({
    address: CONTRACT_ADDRESSES.AgroVault,
    abi: AGRO_VAULT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: totalAssets, error: assetsError } = useReadContract({
    address: CONTRACT_ADDRESSES.AgroVault,
    abi: AGRO_VAULT_ABI,
    functionName: "totalAssets",
  });

  // Contract writes
  const { writeContract: approveWrite, data: approveHash } = useWriteContract();
  const { writeContract: depositWrite, data: depositHash } = useWriteContract();

  // Transaction receipts
  const { isLoading: isApprovePending, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    });

  const { isLoading: isDepositPending, isSuccess: isDepositSuccess } =
    useWaitForTransactionReceipt({
      hash: depositHash,
    });

  if (!vault) {
    notFound();
  }

  const vaultNotes = useMemo(
    () => notes.filter((note) => note.vaultId === vault.id),
    [notes, vault.id]
  );

  const position = positions[vault.id];

  const depositAmountBigInt = useMemo<bigint>(() => {
    try {
      return depositAmount ? parseUnits(depositAmount, 6) : 0n;
    } catch {
      return 0n;
    }
  }, [depositAmount]);

  const allowanceBigInt = (allowance ?? 0n) as bigint;
  const needsApproval =
    depositAmountBigInt > 0n && allowanceBigInt < depositAmountBigInt;

  const handleApprove = async () => {
    if (!depositAmountBigInt || depositAmountBigInt === 0n) return;
    setApprovalPending(true);
    try {
      approveWrite({
        address: CONTRACT_ADDRESSES.MockStablecoin,
        abi: MOCK_STABLECOIN_ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESSES.AgroVault, depositAmountBigInt],
      });
    } catch (error) {
      console.error("Approval error:", error);
      setApprovalPending(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !depositAmountBigInt) return;

    depositWrite({
      address: CONTRACT_ADDRESSES.AgroVault,
      abi: AGRO_VAULT_ABI,
      functionName: "deposit",
      args: [depositAmountBigInt, address],
    });
  };

  // Reset states on success
  useEffect(() => {
    if (isApproveSuccess && approvalPending) {
      setApprovalPending(false);
    }
  }, [isApproveSuccess, approvalPending]);

  useEffect(() => {
    if (isDepositSuccess) {
      setDepositAmount("");
    }
  }, [isDepositSuccess]);

  return (
    <main className="min-h-screen bg-rayls-black text-white px-6 py-12 lg:px-12 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3): Chart & Assets */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-col gap-2 mb-6">
            <div className="flex items-center gap-2 text-sm text-rayls-grey uppercase tracking-wider">
              <TrendingUp className="h-4 w-4 text-rayls-lime" /> Institutional
              Access Strategy
            </div>
            <h1 className="text-3xl font-bold text-white">{vault.name}</h1>
            <div className="flex gap-4 text-sm text-rayls-grey">
              <span>
                TVL:{" "}
                <span className="text-white font-mono">
                  {((totalAssets ?? 0n) as bigint) > 0n
                    ? `$${formatUnits((totalAssets ?? 0n) as bigint, 6)}`
                    : vault.tvl.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                </span>
              </span>
              <span>
                Target APY:{" "}
                <span className="text-rayls-lime font-mono">
                  {(vault.baseApr * 100).toFixed(1)}%
                </span>
              </span>
            </div>
          </div>

          {/* Chart Section */}
          <Card className="bg-rayls-charcoal border-rayls-border p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white">
                Projected vs Realized Yield
              </h3>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rayls-lime" />{" "}
                  Realized
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rayls-grey/50" />{" "}
                  Projected
                </div>
              </div>
            </div>
            <div className="w-full h-[300px]">
              {isClient && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="colorRealized"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#D9F94F"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#D9F94F"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#27272A"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      stroke="#A1A1AA"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#A1A1AA"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181B",
                        borderColor: "#27272A",
                        borderRadius: "8px",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="projected"
                      stroke="#52525B"
                      strokeDasharray="5 5"
                      fill="none"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="realized"
                      stroke="#D9F94F"
                      fill="url(#colorRealized)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Underlying Assets List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              Underlying Assets
            </h3>
            <Card className="bg-rayls-charcoal border-rayls-border overflow-hidden">
              <div className="grid grid-cols-5 gap-4 p-4 text-xs font-semibold text-rayls-grey uppercase tracking-wider border-b border-rayls-border">
                <div>Asset ID</div>
                <div>Collateral Type</div>
                <div>Maturity</div>
                <div>Status</div>
                <div className="text-right">Risk Grade</div>
              </div>
              <div className="divide-y divide-rayls-border">
                {vaultNotes.length > 0 ? (
                  vaultNotes.map((note) => (
                    <div
                      key={note.id}
                      className="grid grid-cols-5 gap-4 p-4 text-sm items-center hover:bg-white/5 transition-colors"
                    >
                      <div className="font-mono text-rayls-lime truncate">
                        {note.id}
                      </div>
                      <div>{note.collateralType}</div>
                      <div>{note.maturityDate}</div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rayls-lime shadow-[0_0_8px_#D9F94F]" />
                        <span className="text-white">Performing</span>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className="border-rayls-lime text-rayls-lime bg-rayls-lime/10"
                        >
                          {note.riskGrade}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-rayls-grey">
                    No assets currently in this vault.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column (1/3): Deposit/Withdraw & Holdings */}
        <div className="space-y-8">
          <Card className="bg-rayls-charcoal border-rayls-border p-6 sticky top-8">
            <h3 className="text-lg font-semibold text-white mb-6">
              Liquidity Provision
            </h3>

            {/* If disconnected, show connect button */}
            {!isConnected ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <Wallet className="w-12 h-12 text-rayls-grey mb-2" />
                <p className="text-rayls-grey text-center mb-4">
                  Connect your wallet to deposit USDC and start earning yield.
                </p>
                <ConnectButton />
              </div>
            ) : (
              <form onSubmit={handleDeposit} className="space-y-6">
                {/* Deposit Input */}
                <div className="bg-black/40 rounded-lg p-4 border border-rayls-border">
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-rayls-grey">You Deposit</span>
                    <span className="text-rayls-grey flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      Balance:{" "}
                      {usdcBalance
                        ? formatUnits(usdcBalance as bigint, 6)
                        : "0"}{" "}
                      USDC
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="bg-transparent border-none text-2xl font-mono text-white placeholder:text-rayls-grey/50 focus-visible:ring-0 p-0 h-auto"
                    />
                    <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-none text-sm px-3 py-1 h-8">
                      USDC
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowDown className="text-rayls-grey h-5 w-5" />
                </div>

                {/* Receive Output */}
                <div className="bg-black/40 rounded-lg p-4 border border-rayls-border">
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-rayls-grey">You Receive</span>
                    <span className="text-rayls-grey">(Estimated)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-mono text-white">
                      {depositAmount || "0.00"}
                    </span>
                    <Badge className="bg-rayls-lime/20 text-rayls-lime hover:bg-rayls-lime/30 border-none text-sm px-3 py-1 h-8">
                      trCERRADO
                    </Badge>
                  </div>
                </div>

                {/* Info Rows */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-rayls-grey">
                    <span>Projected Earnings (12m)</span>
                    <span className="text-white font-mono">--</span>
                  </div>
                  <div className="flex justify-between text-rayls-grey">
                    <span>Protocol Fee</span>
                    <span className="text-white font-mono">0.1%</span>
                  </div>
                </div>

                {/* Action Button */}
                {needsApproval ? (
                  <Button
                    type="button"
                    onClick={handleApprove}
                    disabled={approvalPending || isApprovePending}
                    className="w-full bg-rayls-lime text-black hover:bg-rayls-lime/90 font-bold h-12"
                  >
                    {approvalPending || isApprovePending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approving USDC...
                      </>
                    ) : (
                      "Approve USDC"
                    )}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={
                      isDepositPending || !depositAmountBigInt || needsApproval
                    }
                    className="w-full bg-white text-black hover:bg-gray-200 font-bold h-12"
                  >
                    {isDepositPending ? "Depositing..." : "Confirm Deposit"}
                  </Button>
                )}
              </form>
            )}
          </Card>

          {/* Holdings Card */}
          {((vaultShares ?? 0n) as bigint) > 0n && (
            <Card className="bg-rayls-charcoal border-rayls-border p-6">
              <h3 className="text-sm font-semibold text-rayls-grey uppercase mb-4">
                Your Position
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-rayls-grey">Shares</div>
                  <div className="text-2xl font-mono font-bold text-white">
                    {formatUnits((vaultShares ?? 0n) as bigint, 15)} trCERRADO
                  </div>
                </div>
                <div className="flex justify-between text-sm border-t border-rayls-border pt-4">
                  <span className="text-rayls-grey">Net APY</span>
                  <span className="text-rayls-lime font-mono">
                    {(vault.baseApr * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
