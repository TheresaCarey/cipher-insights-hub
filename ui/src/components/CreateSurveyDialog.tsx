import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSurveyContract } from "@/hooks/useSurveyContract";
import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";

interface CreateSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateSurveyDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateSurveyDialogProps) => {
  const { createSurvey, isLoading } = useSurveyContract();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [productNames, setProductNames] = useState<string[]>(["Product A", "Product B", "Product C"]);

  const handleAddProduct = () => {
    if (productNames.length < 5) {
      setProductNames([...productNames, `Product ${String.fromCharCode(65 + productNames.length)}`]);
    }
  };

  const handleRemoveProduct = (index: number) => {
    if (productNames.length > 2) {
      setProductNames(productNames.filter((_, i) => i !== index));
    }
  };

  const handleProductNameChange = (index: number, value: string) => {
    const newNames = [...productNames];
    newNames[index] = value;
    setProductNames(newNames);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }
    if (productNames.some(name => !name.trim())) {
      alert("All product names must be filled");
      return;
    }
    if (productNames.length < 2) {
      alert("At least 2 products are required");
      return;
    }
    if (productNames.length > 5) {
      alert("Maximum 5 products allowed");
      return;
    }

    const success = await createSurvey(title, description, productNames);
    if (success) {
      // Reset form
      setTitle("");
      setDescription("");
      setProductNames(["Product A", "Product B", "Product C"]);
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Survey</DialogTitle>
          <DialogDescription>
            Create an anonymous product satisfaction survey. Users will rate each product from 1-5.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Survey Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q1 2024 Product Comparison"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this survey..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Products (2-5 required) *</Label>
              {productNames.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddProduct}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Product
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {productNames.map((name, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={name}
                    onChange={(e) => handleProductNameChange(index, e.target.value)}
                    placeholder={`Product ${String.fromCharCode(65 + index)}`}
                    required
                  />
                  {productNames.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveProduct(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Survey"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

