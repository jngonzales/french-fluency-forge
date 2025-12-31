import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ProductMap {
  id: string;
  offer_price_plan_id: string;
  product_key: string;
  grants_access: boolean;
  credits_delta: number;
  active: boolean;
  note: string | null;
}

const AdminProducts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductMap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductMap | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    offer_price_plan_id: "",
    product_key: "",
    grants_access: false,
    credits_delta: 0,
    active: true,
    note: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadProducts();
  }, [user, navigate]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("systemeio_product_map")
        .select("*")
        .order("product_key");

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error("Error loading products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      offer_price_plan_id: "",
      product_key: "",
      grants_access: false,
      credits_delta: 0,
      active: true,
      note: "",
    });
    setEditingProduct(null);
  };

  const openEditDialog = (product: ProductMap) => {
    setEditingProduct(product);
    setFormData({
      offer_price_plan_id: product.offer_price_plan_id,
      product_key: product.product_key,
      grants_access: product.grants_access,
      credits_delta: product.credits_delta,
      active: product.active,
      note: product.note || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.offer_price_plan_id || !formData.product_key) {
        toast.error("Please fill in required fields");
        return;
      }

      if (editingProduct) {
        const { error } = await supabase
          .from("systemeio_product_map")
          .update({
            offer_price_plan_id: formData.offer_price_plan_id,
            product_key: formData.product_key,
            grants_access: formData.grants_access,
            credits_delta: formData.credits_delta,
            active: formData.active,
            note: formData.note || null,
          })
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast.success("Product updated");
      } else {
        const { error } = await supabase
          .from("systemeio_product_map")
          .insert({
            offer_price_plan_id: formData.offer_price_plan_id,
            product_key: formData.product_key,
            grants_access: formData.grants_access,
            credits_delta: formData.credits_delta,
            active: formData.active,
            note: formData.note || null,
          });

        if (error) throw error;
        toast.success("Product created");
      }

      setDialogOpen(false);
      resetForm();
      loadProducts();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(error.message || "Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product mapping?")) return;

    try {
      const { error } = await supabase
        .from("systemeio_product_map")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Product deleted");
      loadProducts();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Systeme.io Product Mappings</h1>
            <p className="text-muted-foreground">
              Configure how Systeme.io products grant access and credits
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Products
              </CardTitle>
              <CardDescription>
                Map Systeme.io offer_price_plan_id to app behaviors
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Edit Product Mapping" : "Add Product Mapping"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure how this Systeme.io product behaves in the app
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="offer_id">Offer Price Plan ID *</Label>
                    <Input
                      id="offer_id"
                      placeholder="e.g., 12345"
                      value={formData.offer_price_plan_id}
                      onChange={(e) => setFormData({ ...formData, offer_price_plan_id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product_key">Product Key *</Label>
                    <Input
                      id="product_key"
                      placeholder="e.g., base_access, credits_20"
                      value={formData.product_key}
                      onChange={(e) => setFormData({ ...formData, product_key: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Grants Access</Label>
                      <p className="text-xs text-muted-foreground">
                        Activates the user's account
                      </p>
                    </div>
                    <Switch
                      checked={formData.grants_access}
                      onCheckedChange={(checked) => setFormData({ ...formData, grants_access: checked })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credits">Credits Delta</Label>
                    <Input
                      id="credits"
                      type="number"
                      placeholder="0"
                      value={formData.credits_delta}
                      onChange={(e) => setFormData({ ...formData, credits_delta: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of credits to add (use negative to subtract)
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Active</Label>
                    <Switch
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">Note</Label>
                    <Input
                      id="note"
                      placeholder="Optional note"
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    {editingProduct ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No product mappings yet. Add one to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Key</TableHead>
                    <TableHead>Offer ID</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.product_key}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {product.offer_price_plan_id}
                      </TableCell>
                      <TableCell>
                        {product.grants_access ? (
                          <span className="text-green-600">Yes</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.credits_delta !== 0 ? (
                          <span className={product.credits_delta > 0 ? "text-green-600" : "text-red-600"}>
                            {product.credits_delta > 0 ? "+" : ""}{product.credits_delta}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.active ? (
                          <span className="text-green-600">●</span>
                        ) : (
                          <span className="text-muted-foreground">○</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminProducts;
