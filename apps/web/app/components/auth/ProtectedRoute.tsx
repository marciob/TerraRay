"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, Loader2, AlertTriangle } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useSemaphoreAccess } from "@/app/lib/hooks/useSemaphoreAccess";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AccessScope } from "@/app/lib/semaphore-utils";

interface ProtectedRouteProps {
  children: React.ReactNode;
  scope: AccessScope;
  fallbackPath?: string;
}

/**
 * Component that wraps protected content and requires ZK proof of authorization
 */
export function ProtectedRoute({
  children,
  scope,
  fallbackPath = "/",
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isConnected } = useAccount();
  const {
    identity,
    isAuthorized,
    isLoading,
    error,
    generateIdentity,
  } = useSemaphoreAccess();
  
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Once loading is done and user is authorized, show content
    if (!isLoading && isAuthorized && identity) {
      setShowContent(true);
    } else {
      setShowContent(false);
    }
  }, [isLoading, isAuthorized, identity]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-rayls-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-rayls-lime animate-spin mx-auto mb-4" />
          <p className="text-rayls-grey">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-rayls-black flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-rayls-charcoal border-rayls-border p-8">
          <div className="text-center">
            <Shield className="h-16 w-16 text-rayls-lime mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Protected Area
            </h2>
            <p className="text-rayls-grey mb-6">
              This area contains sensitive farmer data and is restricted to
              authorized operators and banks.
            </p>
            <p className="text-sm text-rayls-grey mb-6">
              Connect your wallet to verify your authorization.
            </p>
            <ConnectButton />
          </div>
        </Card>
      </div>
    );
  }

  // No identity generated yet
  if (!identity && !isLoading) {
    return (
      <div className="min-h-screen bg-rayls-black flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-rayls-charcoal border-rayls-border p-8">
          <div className="text-center">
            <Lock className="h-16 w-16 text-rayls-purple mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Generate ZK Identity
            </h2>
            <p className="text-rayls-grey mb-6">
              To access this area, you need to generate a zero-knowledge
              identity that proves you're an authorized viewer without
              revealing your specific identity.
            </p>
            <div className="bg-rayls-dark border border-rayls-border rounded-lg p-4 mb-6 text-left">
              <h3 className="text-sm font-semibold text-white mb-2">
                How it works:
              </h3>
              <ol className="text-xs text-rayls-grey space-y-1 list-decimal list-inside">
                <li>Sign a message with your wallet</li>
                <li>Generate a Semaphore identity from the signature</li>
                <li>Prove you're in the authorized group (ZK proof)</li>
                <li>Access sensitive data privately</li>
              </ol>
            </div>
            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-md flex items-start gap-2 text-red-500 text-sm">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <Button
              onClick={generateIdentity}
              className="w-full bg-rayls-purple text-white hover:bg-rayls-purple/90 font-semibold"
            >
              Generate ZK Identity
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Not authorized (not in group)
  if (identity && !isAuthorized) {
    return (
      <div className="min-h-screen bg-rayls-black flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-rayls-charcoal border-rayls-border p-8">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Access Denied
            </h2>
            <p className="text-rayls-grey mb-6">
              Your identity is not in the authorized viewers group.
            </p>
            <p className="text-sm text-rayls-grey mb-6">
              If you believe this is an error, please contact an administrator
              to add your identity commitment to the authorized group:
            </p>
            <div className="bg-rayls-dark border border-rayls-border rounded-lg p-3 mb-6">
              <p className="text-xs text-rayls-grey break-all font-mono">
                {identity.commitment.toString()}
              </p>
            </div>
            <Button
              onClick={() => router.push(fallbackPath)}
              variant="outline"
              className="w-full"
            >
              Return to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Authorized - show content
  if (showContent) {
    return <>{children}</>;
  }

  // Fallback
  return (
    <div className="min-h-screen bg-rayls-black flex items-center justify-center">
      <Loader2 className="h-12 w-12 text-rayls-lime animate-spin" />
    </div>
  );
}

