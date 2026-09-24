import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-vault',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './vault.component.html',
  styleUrl: './vault.component.scss'
})
export class VaultComponent implements OnInit {
  apiService = inject(ApiService);
  physicalDocs = signal<any[]>([]);

  searchQuery = signal('');
  statusFilter = signal('');
  typeFilter = signal('');

  // Return Document Modal State
  returningDoc = signal<any>(null);
  recipientName = '';
  returnNotes = '';
  isSubmitting = signal(false);

  // Computed KPI Metrics
  totalDocsCount = computed(() => this.physicalDocs().length);

  inCustodyCount = computed(() =>
    this.physicalDocs().filter(d => d.status === 'IN_CUSTODY').length
  );

  deedsCount = computed(() =>
    this.physicalDocs().filter(d => d.documentType === 'TITLE_DEED' || d.documentType === 'SURVEY_PLAN').length
  );

  returnedCount = computed(() =>
    this.physicalDocs().filter(d => d.status === 'RETURNED').length
  );

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.statusFilter()) count++;
    if (this.typeFilter()) count++;
    if (this.searchQuery().trim()) count++;
    return count;
  });

  filteredDocs = computed(() => {
    let list = this.physicalDocs();
    const s = this.statusFilter();
    const t = this.typeFilter();
    const q = this.searchQuery().trim().toLowerCase();

    if (s) {
      list = list.filter(d => d.status === s);
    }
    if (t) {
      list = list.filter(d => d.documentType === t);
    }
    if (q) {
      list = list.filter(d =>
        (d.title || '').toLowerCase().includes(q) ||
        (d.referenceNo || '').toLowerCase().includes(q) ||
        (d.documentType || '').toLowerCase().includes(q) ||
        (d.receivedFrom || '').toLowerCase().includes(q) ||
        (d.physicalLocation || '').toLowerCase().includes(q) ||
        (d.matter?.matterNumber || '').toLowerCase().includes(q) ||
        (d.matter?.title || '').toLowerCase().includes(q)
      );
    }
    return list;
  });

  ngOnInit() {
    this.loadDocs();
  }

  loadDocs() {
    this.apiService.getPhysicalDocuments().subscribe(res => {
      if (res.success) this.physicalDocs.set(res.physicalDocs || []);
    });
  }

  resetFilters() {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.typeFilter.set('');
  }

  openReturnModal(pDoc: any) {
    this.returningDoc.set(pDoc);
    this.recipientName = pDoc.receivedFrom || '';
    this.returnNotes = '';
  }

  closeReturnModal() {
    this.returningDoc.set(null);
  }

  submitReturn() {
    const doc = this.returningDoc();
    if (!doc || !this.recipientName.trim()) return;

    this.isSubmitting.set(true);
    this.apiService.returnPhysicalDocument(doc.id, {
      returnedTo: this.recipientName,
      notes: this.returnNotes
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeReturnModal();
        this.loadDocs();
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }
}
