"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PartnerFormDto } from "@/lib/dto/finance-partner";

type Props = {
  open: boolean;
  loading: boolean;
  title: string;
  description: string;
  form: PartnerFormDto;
  onOpenChange: (open: boolean) => void;
  onChange: (form: PartnerFormDto) => void;
  onSubmit: () => void;
};

export default function PartnerFormData({
  open,
  loading,
  title,
  description,
  form,
  onOpenChange,
  onChange,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="space-y-6"
        >
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Kode *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => onChange({ ...form, code: e.target.value })}
                  placeholder="Mis. C001"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Nama *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => onChange({ ...form, name: e.target.value })}
                  placeholder="Nama"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => onChange({ ...form, email: e.target.value })}
                  placeholder="email@domain.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Telepon</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => onChange({ ...form, phone: e.target.value })}
                  placeholder="Nomor telepon"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Alamat</Label>
              <Textarea
                value={form.address}
                onChange={(e) => onChange({ ...form, address: e.target.value })}
                placeholder="Alamat lengkap"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : form.id ? "Update" : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
