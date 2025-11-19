"use client";

import { notFound, useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowDown, Wallet, Info, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { DepositSchema, type DepositPayload } from "@/app/lib/schemas";
import { useDemo } from "@/app/lib/demo-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Mock data for the chart
const chartData = [
  { month: 'Jan', realized: 10, projected: 10.2 },
  { month: 'Feb', realized: 12, projected: 12.5 },
  { month: 'Mar', realized: 11.5, projected: 13.0 },
  { month: 'Apr', realized: 13.8, projected: 14.1 },
  { month: 'May', realized: 14.2, projected: 14.5 },
  { month: 'Jun', realized: 14.9, projected: 15.2 },
  { month: 'Jul', realized: 15.5, projected: 15.8 },
];

export default function VaultDetailPage() {
  const params = useParams<{ vaultId: string }>();
  const { vaults, notes, positions, deposit } = useDemo();
  const { isConnected } = useAccount();
  const [depositAmount, setDepositAmount] = useState<string>("");
  
  const vaultId = decodeURIComponent(params.vaultId);
  const vault = vaults.find((candidate) => candidate.id === vaultId);

  if (!vault) {
    notFound();
  }

  const vaultNotes = useMemo(
    () => notes.filter((note) => note.vaultId === vault.id),
    [notes, vault.id],
  );

  const position = positions[vault.id];

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(depositAmount);
    if (amount > 0) {
        deposit(vault.id, amount);
        setDepositAmount("");
    }
  };

  return (
    <main className="min-h-screen bg-rayls-black text-white px-6 py-12 lg:px-12 font-sans">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column (2/3): Chart & Assets */}
            <div className="lg:col-span-2 space-y-8">
                <div className="flex flex-col gap-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-rayls-grey uppercase tracking-wider">
                        <TrendingUp className="h-4 w-4 text-rayls-lime" /> Institutional Access Strategy
                    </div>
                    <h1 className="text-3xl font-bold text-white">{vault.name}</h1>
                    <div className="flex gap-4 text-sm text-rayls-grey">
                         <span>TVL: <span className="text-white font-mono">{vault.tvl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></span>
                         <span>Target APY: <span className="text-rayls-lime font-mono">{(vault.baseApr * 100).toFixed(1)}%</span></span>
                    </div>
                </div>

                {/* Chart Section */}
                <Card className="bg-rayls-charcoal border-rayls-border p-6 h-[350px] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-white">Projected vs Realized Yield</h3>
                        <div className="flex gap-4 text-xs">
                             <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rayls-lime" /> Realized</div>
                             <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rayls-grey/50" /> Projected</div>
                        </div>
                    </div>
                    <div className="flex-1 w-full h-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRealized" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D9F94F" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#D9F94F" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                                <XAxis dataKey="month" stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#27272A', color: '#FFF' }}
                                    itemStyle={{ color: '#D9F94F' }}
                                />
                                <Area type="monotone" dataKey="realized" stroke="#D9F94F" strokeWidth={2} fillOpacity={1} fill="url(#colorRealized)" />
                                <Area type="monotone" dataKey="projected" stroke="#A1A1AA" strokeWidth={1} strokeDasharray="5 5" fill="none" />
                            </AreaChart>
                         </ResponsiveContainer>
                    </div>
                </Card>

                {/* Underlying Assets Table */}
                <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Underlying Assets</h3>
                    <div className="rounded-xl border border-rayls-border bg-rayls-charcoal overflow-hidden">
                        <table className="w-full text-sm text-left">
                             <thead className="text-xs text-rayls-grey uppercase bg-rayls-dark border-b border-rayls-border">
                                <tr>
                                    <th className="px-6 py-4">Asset ID</th>
                                    <th className="px-6 py-4">Collateral Type</th>
                                    <th className="px-6 py-4">Maturity</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Risk Grade</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-rayls-border">
                                {vaultNotes.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-rayls-grey">No assets currently in this pool.</td></tr>
                                ) : (
                                    vaultNotes.map(note => (
                                        <tr key={note.id} className="hover:bg-rayls-hover transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs text-white">{note.id.split('-')[0]}...</td>
                                            <td className="px-6 py-4">{vault.cropTypes[0]}</td>
                                            <td className="px-6 py-4 text-rayls-grey">{note.tenorMonths} Months</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${note.status === 'Active' ? 'bg-rayls-lime shadow-[0_0_8px_#D9F94F]' : 'bg-red-500'}`} />
                                                    <span className="text-xs">{note.status === 'Active' ? 'Performing' : note.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Badge variant="outline" className="border-rayls-purple text-rayls-purple text-xs">
                                                     {vault.riskBand}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                             </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Right Sidebar (1/3): Deposit */}
            <div className="space-y-6">
                <Card className="bg-rayls-charcoal border-rayls-border p-6 sticky top-24">
                    <h2 className="text-lg font-semibold text-white mb-6">Liquidity Provision</h2>
                    
                    {!isConnected ? (
                        <div className="text-center py-8 space-y-4">
                             <p className="text-sm text-rayls-grey">Connect your wallet to access this institutional vault.</p>
                             <div className="flex justify-center">
                                 <ConnectButton label="Connect Wallet" />
                             </div>
                        </div>
                    ) : (
                        <form onSubmit={handleDeposit} className="space-y-4 relative">
                             <div className="bg-rayls-dark p-4 rounded-lg border border-rayls-border">
                                <div className="flex justify-between text-xs text-rayls-grey mb-2">
                                    <span>You Deposit</span>
                                    <span className="flex items-center gap-1"><Wallet className="h-3 w-3" /> Balance: $50k</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Input 
                                        type="number" 
                                        placeholder="0.00" 
                                        className="border-none bg-transparent text-2xl font-mono p-0 focus-visible:ring-0 h-auto placeholder:text-rayls-grey/30"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                    />
                                    <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-none">USDC</Badge>
                                </div>
                             </div>

                             <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-[48%] z-10">
                                 <div className="bg-rayls-black rounded-full p-2 border border-rayls-border text-rayls-grey">
                                     <ArrowDown className="h-4 w-4" />
                                 </div>
                             </div>

                             <div className="bg-rayls-dark p-4 rounded-lg border border-rayls-border">
                                <div className="flex justify-between text-xs text-rayls-grey mb-2">
                                    <span>You Receive</span>
                                    <span>(Estimated)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl font-mono text-white flex-1 truncate">
                                        {depositAmount ? (Number(depositAmount) * 1).toFixed(2) : "0.00"}
                                    </div>
                                    <Badge className="bg-rayls-lime/20 text-rayls-lime hover:bg-rayls-lime/30 border-none">trCERRADO</Badge>
                                </div>
                             </div>

                             <div className="bg-rayls-black/50 p-3 rounded-lg text-xs space-y-2">
                                 <div className="flex justify-between text-rayls-grey">
                                     <span>Projected Earnings (12m)</span>
                                     <span className="text-rayls-lime">
                                         {depositAmount ? `+ ${(Number(depositAmount) * vault.baseApr).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}` : '--'}
                                     </span>
                                 </div>
                                  <div className="flex justify-between text-rayls-grey">
                                     <span>Protocol Fee</span>
                                     <span>0.1%</span>
                                 </div>
                             </div>

                             <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200 font-bold h-12">
                                 Confirm Deposit
                             </Button>
                        </form>
                    )}
                </Card>

                {/* Holdings Card */}
                {position && (
                    <Card className="bg-rayls-charcoal border-rayls-border p-6">
                        <h3 className="text-sm font-semibold text-rayls-grey uppercase mb-4">Your Position</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="text-xs text-rayls-grey">Current Value</div>
                                <div className="text-2xl font-mono font-bold text-white">
                                    {((position.shares ?? 0) * (vault.tvl / (position.deposited || 1))).toLocaleString('en-US', { style: 'currency', currency: 'BRL' })}
                                </div>
                            </div>
                             <div className="flex justify-between text-sm border-t border-rayls-border pt-4">
                                <span className="text-rayls-grey">Net APY</span>
                                <span className="text-rayls-lime font-mono">{(vault.baseApr * 100).toFixed(2)}%</span>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    </main>
  );
}
