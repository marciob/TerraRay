//app/lib/demo-context.tsx
"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { mockFarmers, mockNotes, mockVaults } from "./mock-data";
import type { Farmer, LoanNote, Vault } from "./schemas";

type DemoState = {
  farmers: Farmer[];
  vaults: Vault[];
  notes: LoanNote[];
  positions: Record<
    string,
    {
      vaultId: string;
      deposited: number;
      shares: number;
    }
  >;
  addFarmer: (farmer: Farmer) => void;
  addNote: (note: LoanNote) => void;
  deposit: (vaultId: string, amount: number) => void;
  recordRepayment: (noteId: string, amount: number) => void;
};

const DemoContext = createContext<DemoState | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [farmers, setFarmers] = useState<Farmer[]>(mockFarmers);
  const [notes, setNotes] = useState<LoanNote[]>(mockNotes);
  const [vaults, setVaults] = useState<Vault[]>(mockVaults);
  const [positions, setPositions] = useState<DemoState["positions"]>({});

  const value = useMemo<DemoState>(() => {
    const addFarmer = (farmer: Farmer) => {
      setFarmers((prev) => [...prev, farmer]);
    };

    const addNote = (note: LoanNote) => {
      setNotes((prev) => [...prev, note]);
    };

    const deposit = (vaultId: string, amount: number) => {
      if (amount <= 0) return;

      setVaults((prev) =>
        prev.map((vault) =>
          vault.id === vaultId ? { ...vault, tvl: vault.tvl + amount } : vault
        )
      );

      setPositions((prev) => {
        const existing = prev[vaultId] ?? {
          vaultId,
          deposited: 0,
          shares: 0,
        };

        return {
          ...prev,
          [vaultId]: {
            vaultId,
            deposited: existing.deposited + amount,
            shares: existing.shares + amount,
          },
        };
      });
    };

    const recordRepayment = (noteId: string, amount: number) => {
      setNotes((prev) =>
        prev.map((note) => {
          if (note.id !== noteId) return note;
          const newOutstanding = Math.max(note.outstanding - amount, 0);

          if (amount > 0) {
            setVaults((prevVaults) =>
              prevVaults.map((vault) =>
                vault.id === note.vaultId
                  ? { ...vault, tvl: vault.tvl + amount }
                  : vault
              )
            );
          }

          return {
            ...note,
            outstanding: newOutstanding,
            status: newOutstanding === 0 ? "Repaid" : note.status,
          };
        })
      );
    };

    return {
      farmers,
      vaults,
      notes,
      positions,
      addFarmer,
      addNote,
      deposit,
      recordRepayment,
    };
  }, [farmers, notes, vaults, positions]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    throw new Error("useDemo must be used within DemoProvider");
  }
  return ctx;
}
