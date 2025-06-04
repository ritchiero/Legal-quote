export interface PaymentMethod {
  id: string;
  type: string;
  details: any;
  isDefault: boolean;
  isActive?: boolean;
  createdAt: any;
  updatedAt: any;
}
