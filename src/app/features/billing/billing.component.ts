import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss'
})
export class BillingComponent implements OnInit {
  apiService = inject(ApiService);
  authService = inject(AuthService);

  activeTab = signal<'invoices' | 'payments'>('invoices');
  invoices = signal<any[]>([]);
  payments = signal<any[]>([]);
  matters = signal<any[]>([]);

  searchQuery = signal('');
  statusFilter = signal('');
  paymentMethodFilter = signal('');

  showInvoiceModal = signal(false);
  recordingPaymentInvoice = signal<any>(null);
  selectedReceipt = signal<any>(null);
  isSubmitting = signal(false);

  // New Invoice Form
  newInvoiceData: any = {
    matterId: '',
    clientId: '',
    dueDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    items: [
      { description: 'Senior Counsel Court Appearance Fee', unitPrice: 150000 }
    ]
  };

  // Payment Recording Form
  paymentForm = {
    amount: 0,
    paymentMethod: 'BANK_TRANSFER',
    transactionRef: '',
    notes: ''
  };

  // Computed Financial Metrics
  totalInvoicedSum = computed(() =>
    this.invoices().reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0)
  );

  totalPaidSum = computed(() =>
    this.invoices().reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0)
  );

  totalOutstandingSum = computed(() =>
    this.invoices().reduce((sum, inv) => sum + (Number(inv.balanceDue) || 0), 0)
  );

  paidInvoicesCount = computed(() =>
    this.invoices().filter(inv => inv.status === 'PAID').length
  );

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.statusFilter()) count++;
    if (this.paymentMethodFilter()) count++;
    if (this.searchQuery().trim()) count++;
    return count;
  });

  filteredInvoices = computed(() => {
    let list = this.invoices();
    const s = this.statusFilter();
    const q = this.searchQuery().trim().toLowerCase();

    if (s) {
      list = list.filter(inv => inv.status === s);
    }
    if (q) {
      list = list.filter(inv =>
        (inv.invoiceNumber || '').toLowerCase().includes(q) ||
        (inv.client?.name || '').toLowerCase().includes(q) ||
        (inv.matter?.matterNumber || '').toLowerCase().includes(q) ||
        (inv.matter?.title || '').toLowerCase().includes(q)
      );
    }
    return list;
  });

  filteredPayments = computed(() => {
    let list = this.payments();
    const m = this.paymentMethodFilter();
    const q = this.searchQuery().trim().toLowerCase();

    if (m) {
      list = list.filter(p => p.paymentMethod === m);
    }
    if (q) {
      list = list.filter(p =>
        (p.paymentNumber || '').toLowerCase().includes(q) ||
        (p.receipt?.receiptNumber || '').toLowerCase().includes(q) ||
        (p.client?.name || '').toLowerCase().includes(q) ||
        (p.invoice?.invoiceNumber || '').toLowerCase().includes(q) ||
        (p.paymentMethod || '').toLowerCase().includes(q)
      );
    }
    return list;
  });

  ngOnInit() {
    this.loadInvoices();
    this.loadPayments();
    this.apiService.getMatters().subscribe(res => {
      if (res.success) this.matters.set(res.matters || []);
    });
  }

  loadInvoices() {
    this.apiService.getInvoices().subscribe(res => {
      if (res.success) this.invoices.set(res.invoices || []);
    });
  }

  loadPayments() {
    this.apiService.getPayments().subscribe(res => {
      if (res.success) this.payments.set(res.payments || []);
    });
  }

  resetFilters() {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.paymentMethodFilter.set('');
  }

  openNewInvoiceModal() {
    this.newInvoiceData = {
      matterId: this.matters().length > 0 ? this.matters()[0].id : '',
      clientId: this.matters().length > 0 ? this.matters()[0].clientId : '',
      dueDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
      items: [
        { description: 'Senior Counsel Court Appearance & Trial Fee', unitPrice: 150000 }
      ]
    };
    if (this.newInvoiceData.matterId) {
      this.onMatterSelect(this.newInvoiceData.matterId);
    }
    this.showInvoiceModal.set(true);
  }

  closeInvoiceModal() {
    this.showInvoiceModal.set(false);
  }

  onMatterSelect(matterId: string) {
    const selected = this.matters().find(m => m.id === matterId);
    if (selected) {
      this.newInvoiceData.clientId = selected.clientId || selected.client?.id;
    }
  }

  addInvoiceItem() {
    this.newInvoiceData.items.push({ description: '', unitPrice: 0 });
  }

  removeInvoiceItem(index: number) {
    if (this.newInvoiceData.items.length > 1) {
      this.newInvoiceData.items.splice(index, 1);
    }
  }

  calcTotal(): number {
    return this.newInvoiceData.items.reduce((acc: number, item: any) => acc + (Number(item.unitPrice) || 0), 0);
  }

  saveInvoice() {
    if (!this.newInvoiceData.matterId || !this.newInvoiceData.clientId) {
      alert('Please select a valid matter with an assigned client.');
      return;
    }

    this.isSubmitting.set(true);
    const payload = {
      ...this.newInvoiceData,
      items: this.newInvoiceData.items.map((i: any) => ({
        description: i.description || 'Professional Legal Service',
        quantity: 1,
        unitPrice: Number(i.unitPrice),
        amount: Number(i.unitPrice)
      }))
    };

    this.apiService.createInvoice(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeInvoiceModal();
        this.loadInvoices();
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  openPaymentModal(inv: any) {
    this.recordingPaymentInvoice.set(inv);
    this.paymentForm = {
      amount: inv.balanceDue || inv.totalAmount,
      paymentMethod: 'BANK_TRANSFER',
      transactionRef: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      notes: ''
    };
  }

  closePaymentModal() {
    this.recordingPaymentInvoice.set(null);
  }

  submitPayment() {
    const inv = this.recordingPaymentInvoice();
    if (!inv || this.paymentForm.amount <= 0) return;

    this.isSubmitting.set(true);
    this.apiService.recordPayment(inv.id, {
      amount: Number(this.paymentForm.amount),
      paymentMethod: this.paymentForm.paymentMethod,
      transactionRef: this.paymentForm.transactionRef,
      notes: this.paymentForm.notes
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closePaymentModal();
        this.loadInvoices();
        this.loadPayments();
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  viewReceipt(payment: any) {
    this.selectedReceipt.set(payment);
  }

  closeReceiptModal() {
    this.selectedReceipt.set(null);
  }

  isPastDue(dueDateStr: string, status: string): boolean {
    if (!dueDateStr || status === 'PAID') return false;
    const due = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }
}
