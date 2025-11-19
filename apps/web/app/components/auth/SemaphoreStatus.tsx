"use client";

import { Shield, Check, X, Loader2, Copy } from "lucide-react";
import { useSemaphoreAccess } from "@/app/lib/hooks/useSemaphoreAccess";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/**
 * Component showing the user's Semaphore authorization status
 * Can be added to operator/admin pages to show ZK identity info
 */
export function SemaphoreStatus() {
  const {
    identity,
    isAuthorized,
    isLoading,
    error,
    generateIdentity,
    logout,
  } = useSemaphoreAccess();
  
  const [copied, setCopied] = useState(false);

  const copyCommitment = () => {
    if (identity) {
      navigator.clipboard.writeText(identity.commitment.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-rayls-charcoal border-rayls-border p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-rayls-lime animate-spin" />
          <span className="text-sm text-rayls-grey">
            Checking authorization...
          </span>
        </div>
      </Card>
    );
  }

  if (!identity) {
    return (
      <Card className="bg-rayls-charcoal border-rayls-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-rayls-grey" />
            <div>
              <p className="text-sm font-semibold text-white">
                No ZK Identity
              </p>
              <p className="text-xs text-rayls-grey">
                Generate an identity to access protected areas
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={generateIdentity}
            className="bg-rayls-purple text-white hover:bg-rayls-purple/90"
          >
            Generate Identity
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-rayls-charcoal border-rayls-border p-4">
      <div className="space-y-3">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield
              className={`h-5 w-5 ${
                isAuthorized ? "text-rayls-lime" : "text-yellow-500"
              }`}
            />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white">
                  ZK Identity Status
                </p>
                {isAuthorized ? (
                  <Badge className="bg-rayls-lime/20 text-rayls-lime border-none text-xs px-2 py-0">
                    <Check className="h-3 w-3 mr-1" />
                    Authorized
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500/20 text-yellow-500 border-none text-xs px-2 py-0">
                    <X className="h-3 w-3 mr-1" />
                    Not Authorized
                  </Badge>
                )}
              </div>
              <p className="text-xs text-rayls-grey">
                {isAuthorized
                  ? "You can access protected resources"
                  : "Your commitment is not in the authorized group"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={logout}
            className="text-xs"
          >
            Logout
          </Button>
        </div>

        {/* Commitment */}
        <div className="border-t border-rayls-border pt-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-rayls-grey">Identity Commitment:</p>
            <button
              onClick={copyCommitment}
              className="text-xs text-rayls-lime hover:text-rayls-lime/80 flex items-center gap-1"
            >
              <Copy className="h-3 w-3" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-xs font-mono text-white break-all bg-rayls-dark p-2 rounded">
            {identity.commitment.toString()}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Not Authorized Help */}
        {!isAuthorized && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
            <p className="text-xs text-yellow-500 mb-2 font-semibold">
              How to get authorized:
            </p>
            <ol className="text-xs text-yellow-400 space-y-1 list-decimal list-inside">
              <li>Copy your identity commitment above</li>
              <li>Send it to an administrator</li>
              <li>Admin runs: <code className="bg-black/30 px-1 py-0.5 rounded">COMMITMENT=0x... npm run add-member</code></li>
              <li>Refresh this page</li>
            </ol>
          </div>
        )}
      </div>
    </Card>
  );
}

