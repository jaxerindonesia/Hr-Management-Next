export type PartnerDto = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export type PartnerFormDto = {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
};
