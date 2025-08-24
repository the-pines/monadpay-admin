"use client";

import { useMemo, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { BaseError, parseUnits } from "viem";
import AdminMinterAbi from "../abis/AdminMinterLeaderboard.sol/AdminMinterLeaderboard.json";
import type { Abi } from "viem";

const AML_ADDRESS = process.env.NEXT_PUBLIC_AML_ADDRESS as `0x${string}`;

const AdminMinterTyped = AdminMinterAbi as { abi: Abi };

export default function Home() {
  const { address, isConnected } = useAccount();
  const [target, setTarget] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const { data: isAdmin } = useReadContract({
    abi: AdminMinterTyped.abi,
    address: AML_ADDRESS,
    functionName: "admins",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: Boolean(address && AML_ADDRESS) },
  });

  const { writeContractAsync, isPending } = useWriteContract();

  const decimals = 0; // Points are integer
  const parsedAmount = useMemo(() => {
    try {
      if (!amount) return BigInt(0);
      return parseUnits(amount, Number(decimals));
    } catch {
      return BigInt(0);
    }
  }, [amount, decimals]);

  async function onMint() {
    setError(null);
    setTxHash(null);
    try {
      if (!AML_ADDRESS) throw new Error("Missing AML address");
      const hash = await writeContractAsync({
        abi: AdminMinterTyped.abi,
        address: AML_ADDRESS,
        functionName: "award",
        args: [target as `0x${string}`, parsedAmount],
      });
      setTxHash(hash);
    } catch (e: unknown) {
      const msg =
        e instanceof BaseError ? e.shortMessage : (e as Error).message;
      setError(msg || "Transaction failed");
    }
  }

  async function onBurn() {
    setError(
      "Burn is not supported by the admin contract. It requires the minter contract to expose a burn method."
    );
  }

  return (
    <div className='space-y-6'>
      <header className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>Admin Dashboard</h1>
        <button
          onClick={() => {
            const w = window as unknown as {
              appKit?: { open?: () => void };
            };
            w.appKit?.open?.();
          }}
          className='px-3 py-2 rounded-md border'
        >
          {isConnected
            ? `${address?.slice(0, 6)}…${address?.slice(-4)}`
            : "Connect"}
        </button>
      </header>

      <div className='grid gap-3'>
        <label className='grid gap-1'>
          <span className='text-sm'>Recipient address</span>
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder='0x...'
            className='border rounded p-2'
          />
        </label>
        <label className='grid gap-1'>
          <span className='text-sm'>Amount</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder='100'
            className='border rounded p-2'
          />
        </label>

        <div className='flex gap-2'>
          <button
            disabled={!isConnected || !isAdmin || isPending}
            onClick={onMint}
            className='px-3 py-2 rounded-md bg-black text-white disabled:opacity-50'
          >
            Mint
          </button>
          <button
            disabled
            onClick={onBurn}
            className='px-3 py-2 rounded-md border disabled:opacity-50'
          >
            Burn
          </button>
        </div>
        {!isConnected && (
          <p className='text-sm text-gray-500'>Connect wallet to proceed.</p>
        )}
        {isConnected && !isAdmin && (
          <p className='text-sm text-red-600'>
            Connected wallet is not an admin.
          </p>
        )}
        {txHash && (
          <p className='text-sm'>
            Submitted:{" "}
            <a
              className='underline'
              href={`${process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL}/tx/${txHash}`}
              target='_blank'
              rel='noreferrer'
            >
              {txHash}
            </a>
          </p>
        )}
        {error && <p className='text-sm text-red-600'>{error}</p>}
      </div>
    </div>
  );
}
