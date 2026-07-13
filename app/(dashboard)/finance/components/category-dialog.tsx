"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryFormState } from "../types";

type Props = {
  open: boolean;
  loading: boolean;
  form: CategoryFormState;
  onOpenChange: (open: boolean) => void;
  onChange: (form: CategoryFormState) => void;
  onSubmit: () => void;
};

export default function CategoryDialog({
  open,
  loading,
  form,
  onOpenChange,
  onChange,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit": "Tambah"} Kategori Akun</DialogTitle>
          <DialogDescription>{form.id ? "Edit": "Tambah"} kategori akun untuk struktur finance yang lebih rapi.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Kode</Label>
            <Input
              value={form.code}
              onChange={(e) => onChange({ ...form, code: e.target.value })}
              placeholder="Mis. 1100"
            />
          </div>
          <div className="grid gap-2">
            <Label>Nama</Label>
            <Input
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              placeholder="Mis. Kas & Bank"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {form.id ? "Update" : "Simpan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
