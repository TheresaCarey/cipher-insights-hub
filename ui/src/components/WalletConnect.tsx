import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Wallet, Copy, ExternalLink, LogOut, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const WalletConnect = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress] = useState("0x742d...5e3A");
  const [rewardBalance] = useState("125.5");
  const [totalSurveys] = useState(12);
  const { toast } = useToast();

  const handleConnect = () => {
    try {
      toast({
        title: "Wallet Connected",
        description: "Rainbow Wallet successfully connected to receive rewards.",
      });
      setIsConnected(true);
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    try {
      toast({
        title: "Wallet Disconnected",
        description: "Rainbow Wallet has been disconnected.",
      });
      setIsConnected(false);
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText("0x742d35e8f4B5A8c9d3e1F9a2b6c8d4e7f1a3c5e3A");
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard.",
    });
  };

  const handleViewOnExplorer = () => {
    toast({
      title: "Opening Explorer",
      description: "Opening transaction history in blockchain explorer.",
    });
  };

  return (
    <Card className="transition-all hover:shadow-lg" style={{ boxShadow: "var(--shadow-widget)" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Rainbow Wallet
        </CardTitle>
        <CardDescription>
          {isConnected 
            ? "Manage your rewards and participation" 
            : "Connect your wallet to receive participant rewards"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <Button 
            onClick={handleConnect} 
            className="w-full"
          >
            Connect Wallet
          </Button>
        ) : (
          <>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono">{walletAddress}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyAddress}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleViewOnExplorer}
                  className="h-8 w-8 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Rewards</span>
                <Badge variant="secondary" className="text-base font-semibold">
                  {rewardBalance} ETH
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Surveys Completed</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-sm font-medium">{totalSurveys}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Rewards</span>
                <span className="text-sm font-medium text-amber-500">15.3 ETH</span>
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleViewOnExplorer}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View History
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDisconnect}
                className="flex-1"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
