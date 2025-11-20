import { Shield } from "lucide-react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import logo from "@/assets/logo.svg";

export const Header = () => {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Cipher Insights Hub" className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Cipher Insights Hub</h1>
              <p className="text-sm text-muted-foreground">Anonymous Product Satisfaction Surveys</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>FHE Protected</span>
            </div>
            <ConnectButton showBalance={false} />
          </div>
        </div>
      </div>
    </header>
  );
};
