import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../../core/services/api';
import { AuthService } from '../../../core/services/auth';
import { Order, OrderItem } from '../../../core/models';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatChipsModule
  ],
  templateUrl: './order-form.html',
  styleUrl: './order-form.scss'
})
export class OrderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  orderForm!: FormGroup;
  isEditMode = false;
  orderId: string | null = null;
  isLoading = false;
  
  // Display columns for items table
  displayedColumns: string[] = ['product', 'quantity', 'unit', 'unitPrice', 'total', 'actions'];
  
  // Product options (these would come from an API in a real app)
  products = [
    { value: 'harina_000', label: 'Harina 000', unit: 'kg' },
    { value: 'harina_0000', label: 'Harina 0000', unit: 'kg' },
    { value: 'harina_integral', label: 'Harina Integral', unit: 'kg' },
    { value: 'semolin', label: 'Semolín', unit: 'kg' },
    { value: 'salvado', label: 'Salvado', unit: 'kg' }
  ];

  ngOnInit() {
    this.initializeForm();
    
    // Check if we're in edit mode
    this.orderId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.orderId;
    
    if (this.isEditMode && this.orderId) {
      this.loadOrder(this.orderId);
    } else {
      // Add one initial item row for new orders
      this.addItem();
    }
  }

  private initializeForm() {
    this.orderForm = this.fb.group({
      clientName: ['', [Validators.required, Validators.minLength(3)]],
      clientEmail: ['', [Validators.required, Validators.email]],
      clientPhone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s\-\(\)]+$/)]],
      deliveryAddress: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        province: ['', Validators.required],
        postalCode: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
        country: ['Argentina', Validators.required]
      }),
      deliveryDate: ['', Validators.required],
      notes: [''],
      items: this.fb.array([], Validators.required)
    });
  }

  get items(): FormArray {
    return this.orderForm.get('items') as FormArray;
  }

  addItem() {
    const itemForm = this.fb.group({
      productType: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      unit: ['kg']
    });
    
    // Update unit when product changes
    itemForm.get('productType')?.valueChanges.subscribe(productType => {
      const product = this.products.find(p => p.value === productType);
      if (product) {
        itemForm.get('unit')?.setValue(product.unit);
      }
    });
    
    this.items.push(itemForm);
  }

  removeItem(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  getItemTotal(index: number): number {
    const item = this.items.at(index);
    const quantity = item.get('quantity')?.value || 0;
    const unitPrice = item.get('unitPrice')?.value || 0;
    return quantity * unitPrice;
  }

  getOrderTotal(): number {
    let total = 0;
    for (let i = 0; i < this.items.length; i++) {
      total += this.getItemTotal(i);
    }
    return total;
  }

  private loadOrder(orderId: string) {
    this.isLoading = true;
    this.apiService.getOrder(orderId).subscribe({
      next: (order) => {
        this.populateForm(order);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading order:', error);
        this.snackBar.open('Error al cargar el pedido', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  private populateForm(order: Order) {
    this.orderForm.patchValue({
      clientName: order.clientName,
      clientEmail: order.clientEmail,
      clientPhone: order.clientPhone,
      deliveryAddress: order.deliveryAddress,
      deliveryDate: order.deliveryDate,
      notes: order.notes
    });

    // Clear existing items and add order items
    this.items.clear();
    order.items.forEach(item => {
      this.items.push(this.fb.group({
        productType: [item.productType, Validators.required],
        quantity: [item.quantity, [Validators.required, Validators.min(1)]],
        unitPrice: [item.unitPrice, [Validators.required, Validators.min(0)]],
        unit: [item.unit]
      }));
    });
  }

  onSubmit() {
    if (this.orderForm.valid) {
      this.isLoading = true;
      const formValue = this.orderForm.value;
      
      const orderData: Partial<Order> = {
        ...formValue,
        totalAmount: this.getOrderTotal(),
        status: this.isEditMode ? undefined : 'pending', // Don't change status when editing
        createdAt: this.isEditMode ? undefined : new Date()
      };

      const request = this.isEditMode && this.orderId
        ? this.apiService.updateOrder(this.orderId, orderData)
        : this.apiService.createOrder(orderData);

      request.subscribe({
        next: (order) => {
          const message = this.isEditMode ? 'Pedido actualizado exitosamente' : 'Pedido creado exitosamente';
          this.snackBar.open(message, 'Cerrar', { duration: 3000 });
          this.router.navigate(['/orders']);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error saving order:', error);
          this.snackBar.open('Error al guardar el pedido', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.orderForm);
      this.snackBar.open('Por favor corrige los errores en el formulario', 'Cerrar', { duration: 3000 });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  onCancel() {
    this.router.navigate(['/orders']);
  }

  getProductLabel(productType: string): string {
    const product = this.products.find(p => p.value === productType);
    return product ? product.label : productType;
  }
}
