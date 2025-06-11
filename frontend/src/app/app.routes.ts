import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { OrderListComponent } from './features/orders/order-list/order-list';
import { OrderFormComponent } from './features/orders/order-form/order-form';
import { PaymentCheckoutComponent } from './features/payments/payment-checkout/payment-checkout';
import { ShipmentTrackingComponent } from './features/tracking/shipment-tracking/shipment-tracking';

export const routes: Routes = [
  { path: '', redirectTo: '/orders', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'orders', component: OrderListComponent },
  { path: 'orders/new', component: OrderFormComponent },
  { 
    path: 'orders/:id/edit', 
    component: OrderFormComponent,
    data: { preload: false } // Disable prerendering for dynamic routes
  },
  { 
    path: 'payments/:id', 
    component: PaymentCheckoutComponent,
    data: { preload: false } // Disable prerendering for dynamic routes
  },
  { 
    path: 'tracking/:id', 
    component: ShipmentTrackingComponent,
    data: { preload: false } // Disable prerendering for dynamic routes
  },
  { path: '**', redirectTo: '/orders' }
];
