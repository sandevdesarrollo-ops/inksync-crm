import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useStore, fmtMoney } from '@/lib/store';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  Plus,
  Search,
  Minus,
  Pencil,
  Trash2,
  AlertTriangle,
  Download,
  PackageSearch,
} from 'lucide-react';

const CATEGORIES = ['inks', 'needles', 'machines', 'aftercare', 'hygiene', 'supplies'];
const EMPTY_FORM = { name: '', brand: '', category: '', stock: '', minStock: '', price: '', supplier: '' };

function stockTone(stock, minStock) {
  if (stock < minStock) return 'bg-destructive';
  if (stock < minStock * 1.5) return 'bg-warning';
  return 'bg-success';
}

function ProductDialog({ open, onOpenChange, product }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const [form, setForm] = useState(EMPTY_FORM);

  // Sync form when a different product (or add mode) is opened.
  const [syncedId, setSyncedId] = useState(undefined);
  if (open && syncedId !== (product?.id ?? null)) {
    setSyncedId(product?.id ?? null);
    setForm(
      product
        ? {
            name: product.name,
            brand: product.brand || '',
            category: product.category,
            stock: String(product.stock),
            minStock: String(product.minStock),
            price: String(product.price),
            supplier: product.supplier || '',
          }
        : EMPTY_FORM
    );
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const valid = form.name.trim() && form.category;

  const handleOpenChange = (v) => {
    if (!v) setSyncedId(undefined);
    onOpenChange(v);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category,
      stock: Math.max(0, Number(form.stock) || 0),
      minStock: Math.max(0, Number(form.minStock) || 0),
      price: Number(form.price) || 0,
      supplier: form.supplier.trim(),
    };
    if (product) {
      update('inventory', product.id, payload);
      toast({ description: t('inventory.form.updated') });
    } else {
      add('inventory', payload);
      toast({ description: t('inventory.form.added') });
    }
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {product ? t('inventory.form.editTitle') : t('inventory.form.addTitle')}
          </DialogTitle>
          <DialogDescription>
            {product ? t('inventory.form.editDescription') : t('inventory.form.addDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inv-name">{t('inventory.form.name')}</Label>
            <Input
              id="inv-name"
              value={form.name}
              onChange={set('name')}
              placeholder={t('inventory.form.namePlaceholder')}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inv-brand">{t('inventory.form.brand')}</Label>
              <Input
                id="inv-brand"
                value={form.brand}
                onChange={set('brand')}
                placeholder={t('inventory.form.brandPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('inventory.form.category')}</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('inventory.form.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`inventory.categories.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="inv-stock">{t('inventory.form.stock')}</Label>
              <Input id="inv-stock" type="number" min="0" value={form.stock} onChange={set('stock')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-minstock">{t('inventory.form.minStock')}</Label>
              <Input
                id="inv-minstock"
                type="number"
                min="0"
                value={form.minStock}
                onChange={set('minStock')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-price">{t('inventory.form.price')}</Label>
              <Input
                id="inv-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={set('price')}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-supplier">{t('inventory.form.supplier')}</Label>
            <Input
              id="inv-supplier"
              value={form.supplier}
              onChange={set('supplier')}
              placeholder={t('inventory.form.supplierPlaceholder')}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!valid}>
              {t('inventory.form.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function InventoryPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const inventory = useStore((s) => s.inventory);
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const logActivity = useStore((s) => s.logActivity);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const lowStock = inventory.filter((i) => i.stock < i.minStock);

  const filtered = inventory.filter((i) => {
    const q = search.trim().toLowerCase();
    return (
      (category === 'all' || i.category === category) &&
      (i.name.toLowerCase().includes(q) ||
        (i.brand || '').toLowerCase().includes(q) ||
        (i.supplier || '').toLowerCase().includes(q))
    );
  });

  const step = (item, delta) => {
    const next = Math.max(0, item.stock + delta);
    if (next === item.stock) return;
    update('inventory', item.id, { stock: next });
    // Log only when crossing below the threshold, not on every click.
    if (item.stock >= item.minStock && next < item.minStock) {
      logActivity({
        type: 'inventory',
        priority: 'high',
        text: t('inventory.lowStockActivity', {
          name: item.name,
          stock: next,
          min: item.minStock,
          supplier: item.supplier || '—',
        }),
        link: '/inventory',
      });
    }
  };

  const confirmDelete = () => {
    if (!deleting) return;
    remove('inventory', deleting.id);
    toast({ description: t('inventory.deleted') });
    setDeleting(null);
  };

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = [
      t('inventory.form.name'),
      t('inventory.form.brand'),
      t('inventory.form.category'),
      t('inventory.form.stock'),
      t('inventory.form.minStock'),
      t('inventory.form.price'),
      t('inventory.form.supplier'),
    ];
    const rows = inventory.map((i) => [
      i.name,
      i.brand,
      t(`inventory.categories.${i.category}`),
      i.stock,
      i.minStock,
      i.price,
      i.supplier,
    ]);
    const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inksync-inventory.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title={t('inventory.title')} description={t('inventory.description')}>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" />
          {t('inventory.exportCsv')}
        </Button>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('inventory.addProduct')}
        </Button>
      </PageHeader>

      {/* Low-stock alert */}
      {lowStock.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="mb-6 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-warning">
              {t('inventory.lowStockAlert', { count: lowStock.length })}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {lowStock.map((i) => `${i.name} (${i.stock}/${i.minStock})`).join(' · ')}
            </p>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('inventory.searchPlaceholder')}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', ...CATEGORIES].map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                )}
              >
                {t(`inventory.categories.${c}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <PackageSearch className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{t('inventory.empty.title')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('inventory.empty.text')}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSearch('');
              setCategory('all');
            }}
          >
            {t('inventory.empty.clear')}
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('inventory.table.product')}</TableHead>
                <TableHead>{t('inventory.table.category')}</TableHead>
                <TableHead className="min-w-[200px]">{t('inventory.table.stock')}</TableHead>
                <TableHead>{t('inventory.table.price')}</TableHead>
                <TableHead className="hidden md:table-cell">
                  {t('inventory.table.supplier')}
                </TableHead>
                <TableHead className="text-right">{t('inventory.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const pct = Math.min(100, (item.stock / Math.max(item.minStock * 2, 1)) * 100);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.brand}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t(`inventory.categories.${item.category}`)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          aria-label={t('inventory.decrease')}
                          disabled={item.stock === 0}
                          onClick={() => step(item, -1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <div className="w-28">
                          <div className="flex items-baseline justify-between">
                            <span
                              className={cn(
                                'text-sm font-semibold tabular-nums',
                                item.stock < item.minStock && 'text-destructive'
                              )}
                            >
                              {item.stock}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {t('inventory.table.min', { count: item.minStock })}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-300',
                                stockTone(item.stock, item.minStock)
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          aria-label={t('inventory.increase')}
                          onClick={() => step(item, 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {fmtMoney(item.price, settings.currency)}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {item.supplier}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={t('common.edit')}
                          onClick={() => {
                            setEditing(item);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          aria-label={t('common.delete')}
                          onClick={() => setDeleting(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ProductDialog open={dialogOpen} onOpenChange={setDialogOpen} product={editing} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('inventory.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('inventory.deleteText', { name: deleting?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
