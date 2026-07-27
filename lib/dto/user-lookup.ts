export interface UserLookupDto {
  id: string;
  name: string;
  position: string | null;
  department: {
    id: string;
    name: string;
  } | null;
}
