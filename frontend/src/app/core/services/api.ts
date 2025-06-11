import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, Payment, Shipment } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  // Orders API
  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/orders`);
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/orders/${id}`);
  }

  createOrder(order: Partial<Order>): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders`, order);
  }

  updateOrder(id: string, order: Partial<Order>): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/orders/${id}`, order);
  }

  // Payments API
  getPayments(orderId?: string): Observable<Payment[]> {
    const url = orderId 
      ? `${this.baseUrl}/payments?orderId=${orderId}`
      : `${this.baseUrl}/payments`;
    return this.http.get<Payment[]>(url);
  }

  createPayment(payment: Partial<Payment>): Observable<Payment> {
    return this.http.post<Payment>(`${this.baseUrl}/payments`, payment);
  }

  // Shipments API
  getShipment(orderId: string): Observable<Shipment> {
    return this.http.get<Shipment>(`${this.baseUrl}/shipments/${orderId}`);
  }

  updateShipmentLocation(shipmentId: string, lat: number, lng: number): Observable<Shipment> {
    return this.http.put<Shipment>(`${this.baseUrl}/shipments/${shipmentId}/location`, { lat, lng });
  }
}
