export interface User {
  id: string;
  email: string;
  role: 'superuser' | 'admin_molino' | 'operario_molino' | 'dueno_panaderia' | 'empleado_panaderia';
  createdAt: Date;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  bakeryId: string;
  molinoId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  deliveryAddress: DeliveryAddress;
  deliveryDate: Date;
  notes?: string;
  status: 'pending' | 'Creado' | 'Revisado' | 'Aprobado' | 'Enviado' | 'Entregado' | 'Cerrado';
  items: OrderItem[];
  totalAmount: number;
  total: number; // Kept for backward compatibility
  createdAt: Date;
  updatedAt: Date;
  canEdit?: boolean; // true if within 30-minute edit window
}

export interface OrderItem {
  id?: number;
  orderId?: string;
  productType: string;
  sku?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface Shipment {
  id: string;
  orderId: string;
  status: string;
  lat?: number;
  lng?: number;
  recordedAt: Date;
}

export interface Payment {
  id: string;
  orderId: string;
  mpPaymentId: string;
  status: string;
  amount: number;
  paidAt?: Date;
}
