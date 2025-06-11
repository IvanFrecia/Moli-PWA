import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api';
import { AuthService } from '../../../core/services/auth';
import { Order } from '../../../core/models';

@Component({
  selector: 'app-order-list',
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './order-list.html',
  styleUrl: './order-list.scss'
})
export class OrderListComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  orders = signal<Order[]>([]);
  isLoading = signal(true);
  displayedColumns = ['id', 'status', 'total', 'createdAt', 'actions'];
  
  currentUser = this.authService.currentUser;

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.apiService.getOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.isLoading.set(false);
        // For demo purposes, set mock data
        this.setMockOrders();
      }
    });
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Creado': 'accent',
      'Revisado': 'primary',
      'Aprobado': 'primary', 
      'Enviado': 'warn',
      'Entregado': '',
      'Cerrado': ''
    };
    return colors[status] || '';
  }

  createNewOrder(): void {
    this.router.navigate(['/orders/new']);
  }

  editOrder(orderId: string): void {
    this.router.navigate(['/orders', orderId, 'edit']);
  }

  viewOrder(orderId: string): void {
    // For now, navigate to edit mode. In the future, this could be a read-only view
    this.router.navigate(['/orders', orderId, 'edit']);
  }

  private setMockOrders(): void {
    const mockOrders: Order[] = [
      {
        id: '1',
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
        deliveryDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
        notes: 'Entrega por la mañana preferentemente',
        status: 'Creado',
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
        canEdit: true
      },
      {
        id: '2',
        bakeryId: '123',
        molinoId: '456',
        clientName: 'Panadería La Esquina',
        clientEmail: 'administracion@laesquina.com.ar',
        clientPhone: '+54 11 5678-9012',
        deliveryAddress: {
          street: 'Corrientes 567',
          city: 'Buenos Aires',
          province: 'CABA',
          postalCode: '1043',
          country: 'Argentina'
        },
        deliveryDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
        notes: 'Llamar 30 minutos antes de la entrega',
        status: 'Enviado',
        items: [
          {
            productType: 'harina_0000',
            quantity: 25,
            unit: 'kg',
            unitPrice: 350
          },
          {
            productType: 'harina_integral',
            quantity: 30,
            unit: 'kg',
            unitPrice: 420
          }
        ],
        totalAmount: 25100,
        total: 25100,
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(),
        canEdit: false
      }
    ];
    this.orders.set(mockOrders);
    this.isLoading.set(false);
  }
}
