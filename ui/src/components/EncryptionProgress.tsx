import { Progress } from "@/components/ui/progress";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";

export const EncryptionProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate encryption progress
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + 1;
      });
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <footer className="border-t border-border bg-card py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4">
          <Lock className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">FHE Encryption Status</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>
    </footer>
  );
};
