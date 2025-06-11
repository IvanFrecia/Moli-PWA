import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../../core/services/api';
import { AuthService } from '../../../core/services/auth';
import { Order, Payment } from '../../../core/models';

// Declare MercadoPago for TypeScript
declare global {
  interface Window {
    MercadoPago: any;
  }
}

@Component({
  selector: 'app-payment-checkout',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './payment-checkout.html',
  styleUrl: './payment-checkout.scss'
})
export class PaymentCheckoutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  orderId: string | null = null;
  order: Order | null = null;
  isLoading = true;
  isProcessingPayment = false;
  mp: any;

  // Mercado Pago Public Key (use test key for development)
  private readonly MP_PUBLIC_KEY = 'TEST-a3d5b663-664a-4e8a-9688-66c63c3c4388'; // Replace with your actual test key

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id');
    if (this.orderId) {
      this.loadOrder();
      this.initializeMercadoPago();
    } else {
      this.router.navigate(['/orders']);
    }
  }

  private async initializeMercadoPago() {
    try {
      // Load MercadoPago SDK if not already loaded
      if (!window.MercadoPago) {
        await this.loadMercadoPagoSDK();
      }
      
      this.mp = new window.MercadoPago(this.MP_PUBLIC_KEY, {
        locale: 'es-AR'
      });
    } catch (error) {
      console.error('Error initializing MercadoPago:', error);
      this.snackBar.open('Error al cargar el sistema de pagos', 'Cerrar', { duration: 5000 });
    }
  }

  private loadMercadoPagoSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        reject('Document not available');
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.onload = () => resolve();
      script.onerror = () => reject('Failed to load MercadoPago SDK');
      document.head.appendChild(script);
    });
  }

  private loadOrder() {
    if (!this.orderId) return;

    this.isLoading = true;
    this.apiService.getOrder(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading order:', error);
        this.snackBar.open('Error al cargar el pedido', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
        // For demo purposes, set mock order
        this.setMockOrder();
      }
    });
  }

  private setMockOrder() {
    this.order = {
      id: this.orderId!,
      bakeryId: '123',
      molinoId: '456',
      clientName: 'Panadería San Juan',
      clientEmail: 'pedidos@panaderiasanjuan.com',
      clientPhone: '+54 11 4567-8901',
      deliveryAddress: {
        street: 'Av. San Juan 1234',
        city: 'Buenos Aires',
        province: 'CABA',
        postalCode: '1147',
        country: 'Argentina'
      },
      deliveryDate: new Date(Date.now() + 86400000 * 3),
      notes: 'Entrega por la mañana preferentemente',
      status: 'Aprobado',
      items: [
        {
          productType: 'harina_000',
          quantity: 50,
          unit: 'kg',
          unitPrice: 300
        }
      ],
      totalAmount: 15000,
      total: 15000,
      createdAt: new Date(),
      updatedAt: new Date(),
      canEdit: false
    };
    this.isLoading = false;
  }

  async processPayment() {
    if (!this.order || !this.mp) {
      this.snackBar.open('Error: Datos de pago no disponibles', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isProcessingPayment = true;

    try {
      // Create payment preference
      const preferenceData = {
        items: this.order.items.map(item => ({
          title: this.getProductName(item.productType),
          quantity: item.quantity,
          unit_price: item.unitPrice,
          currency_id: 'ARS'
        })),
        payer: {
          name: this.order.clientName,
          email: this.order.clientEmail,
          phone: {
            number: this.order.clientPhone
          }
        },
        back_urls: {
          success: `${window.location.origin}/payment-success/${this.order.id}`,
          failure: `${window.location.origin}/payment-failure/${this.order.id}`,
          pending: `${window.location.origin}/payment-pending/${this.order.id}`
        },
        auto_return: 'approved',
        external_reference: this.order.id,
        notification_url: `${window.location.origin}/api/payments/webhook`,
        statement_descriptor: 'MOLI - Harina',
        payment_methods: {
          excluded_payment_types: [],
          installments: 12
        }
      };

      // In a real application, this would be a backend API call
      // For demo purposes, we'll simulate the preference creation
      const mockPreference = {
        id: 'mock-preference-' + Date.now(),
        init_point: '#', // This would be the actual MP checkout URL
        sandbox_init_point: '#'
      };

      // For demo, redirect to a success simulation
      this.simulatePaymentSuccess();

    } catch (error) {
      console.error('Error processing payment:', error);
      this.snackBar.open('Error al procesar el pago', 'Cerrar', { duration: 3000 });
      this.isProcessingPayment = false;
    }
  }

  private simulatePaymentSuccess() {
    // Simulate payment processing delay
    setTimeout(() => {
      this.snackBar.open('¡Pago procesado exitosamente!', 'Cerrar', { duration: 5000 });
      this.router.navigate(['/orders'], { 
        queryParams: { paymentSuccess: true, orderId: this.order?.id } 
      });
    }, 2000);
  }

  private getProductName(productType: string): string {
    const productNames: { [key: string]: string } = {
      'harina_000': 'Harina 000',
      'harina_0000': 'Harina 0000',
      'harina_integral': 'Harina Integral',
      'semolin': 'Semolín',
      'salvado': 'Salvado'
    };
    return productNames[productType] || productType;
  }

  goBack() {
    this.router.navigate(['/orders']);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'pending': 'accent',
      'Creado': 'accent',
      'Revisado': 'primary',
      'Aprobado': 'primary', 
      'Enviado': 'warn',
      'Entregado': '',
      'Cerrado': ''
    };
    return colors[status] || '';
  }
}
