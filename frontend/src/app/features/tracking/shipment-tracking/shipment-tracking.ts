import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { interval, Subscription } from 'rxjs';
import { ApiService } from '../../../core/services/api';
import { AuthService } from '../../../core/services/auth';
import { Order, Shipment } from '../../../core/models';

// Declare Google Maps for TypeScript
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

@Component({
  selector: 'app-shipment-tracking',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './shipment-tracking.html',
  styleUrl: './shipment-tracking.scss'
})
export class ShipmentTrackingComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  orderId: string | null = null;
  order: Order | null = null;
  shipment: Shipment | null = null;
  isLoading = true;
  map: any;
  marker: any;
  trackingInterval?: Subscription;

  // Buenos Aires center coordinates for demo
  private readonly DEFAULT_LAT = -34.6037;
  private readonly DEFAULT_LNG = -58.3816;

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id');
    if (this.orderId) {
      this.loadOrderAndShipment();
      this.initializeMap();
      this.startLocationTracking();
    } else {
      this.router.navigate(['/orders']);
    }
  }

  ngOnDestroy() {
    if (this.trackingInterval) {
      this.trackingInterval.unsubscribe();
    }
  }

  private async initializeMap() {
    try {
      // Load Google Maps API if not already loaded
      if (!window.google) {
        await this.loadGoogleMapsAPI();
      }
      
      this.createMap();
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      this.snackBar.open('Error al cargar el mapa', 'Cerrar', { duration: 3000 });
    }
  }

  private loadGoogleMapsAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        reject('Document not available');
        return;
      }

      window.initMap = () => {
        resolve();
      };

      const script = document.createElement('script');
      // Replace with your actual Google Maps API key
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap`;
      script.onerror = () => reject('Failed to load Google Maps API');
      document.head.appendChild(script);
    });
  }

  private createMap() {
    const mapOptions = {
      zoom: 13,
      center: { lat: this.DEFAULT_LAT, lng: this.DEFAULT_LNG },
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false
    };

    const mapElement = document.getElementById('map');
    if (mapElement) {
      this.map = new window.google.maps.Map(mapElement, mapOptions);
      
      // Create marker for shipment location
      this.marker = new window.google.maps.Marker({
        position: { lat: this.DEFAULT_LAT, lng: this.DEFAULT_LNG },
        map: this.map,
        title: 'Ubicación del Envío',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/truck.png',
          scaledSize: new window.google.maps.Size(32, 32)
        }
      });

      // Add destination marker if order has delivery address
      if (this.order?.deliveryAddress) {
        this.addDestinationMarker();
      }
    }
  }

  private addDestinationMarker() {
    if (!this.map || !this.order?.deliveryAddress) return;

    // For demo purposes, use a fixed destination location
    // In a real app, you would geocode the delivery address
    const destinationLat = this.DEFAULT_LAT + 0.01;
    const destinationLng = this.DEFAULT_LNG + 0.01;

    const destinationMarker = new window.google.maps.Marker({
      position: { lat: destinationLat, lng: destinationLng },
      map: this.map,
      title: 'Destino: ' + this.order.deliveryAddress.street,
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new window.google.maps.Size(32, 32)
      }
    });

    // Draw route line
    const routePath = new window.google.maps.Polyline({
      path: [
        { lat: this.DEFAULT_LAT, lng: this.DEFAULT_LNG },
        { lat: destinationLat, lng: destinationLng }
      ],
      geodesic: true,
      strokeColor: '#673ab7',
      strokeOpacity: 1.0,
      strokeWeight: 3
    });

    routePath.setMap(this.map);
  }

  private loadOrderAndShipment() {
    if (!this.orderId) return;

    this.isLoading = true;
    
    // Load order
    this.apiService.getOrder(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.loadShipment();
      },
      error: (error) => {
        console.error('Error loading order:', error);
        this.setMockData();
      }
    });
  }

  private loadShipment() {
    if (!this.orderId) return;

    this.apiService.getShipment(this.orderId).subscribe({
      next: (shipment) => {
        this.shipment = shipment;
        this.updateMapLocation();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading shipment:', error);
        this.setMockShipment();
      }
    });
  }

  private setMockData() {
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
      deliveryDate: new Date(Date.now() + 86400000 * 2),
      notes: 'Entrega por la mañana preferentemente',
      status: 'Enviado',
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
    
    this.setMockShipment();
  }

  private setMockShipment() {
    this.shipment = {
      id: 'ship-' + this.orderId,
      orderId: this.orderId!,
      status: 'En tránsito',
      lat: this.DEFAULT_LAT + (Math.random() - 0.5) * 0.02,
      lng: this.DEFAULT_LNG + (Math.random() - 0.5) * 0.02,
      recordedAt: new Date()
    };
    
    this.updateMapLocation();
    this.isLoading = false;
  }

  private updateMapLocation() {
    if (this.map && this.marker && this.shipment?.lat && this.shipment?.lng) {
      const newPosition = { lat: this.shipment.lat, lng: this.shipment.lng };
      this.marker.setPosition(newPosition);
      this.map.panTo(newPosition);
    }
  }

  private startLocationTracking() {
    // Update location every 30 seconds for demo
    this.trackingInterval = interval(30000).subscribe(() => {
      this.updateShipmentLocation();
    });
  }

  private updateShipmentLocation() {
    if (!this.shipment) return;

    // Simulate movement for demo
    const newLat = this.shipment.lat! + (Math.random() - 0.5) * 0.001;
    const newLng = this.shipment.lng! + (Math.random() - 0.5) * 0.001;

    this.shipment = {
      ...this.shipment,
      lat: newLat,
      lng: newLng,
      recordedAt: new Date()
    };

    this.updateMapLocation();
  }

  refreshLocation() {
    if (this.orderId) {
      this.loadShipment();
    }
  }

  goBack() {
    this.router.navigate(['/orders']);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'En tránsito': 'accent',
      'Enviado': 'warn',
      'Entregado': 'primary',
      'Retrasado': 'warn'
    };
    return colors[status] || '';
  }

  getEstimatedArrival(): string {
    if (!this.order?.deliveryDate) return 'No disponible';
    
    const now = new Date();
    const delivery = new Date(this.order.deliveryDate);
    const diffHours = Math.ceil((delivery.getTime() - now.getTime()) / (1000 * 3600));
    
    if (diffHours <= 0) return 'Entrega programada';
    if (diffHours < 24) return `Aproximadamente ${diffHours} horas`;
    
    const diffDays = Math.ceil(diffHours / 24);
    return `Aproximadamente ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  }
}
