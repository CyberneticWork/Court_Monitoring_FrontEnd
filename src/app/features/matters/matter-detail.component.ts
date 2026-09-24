import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-matter-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './matter-detail.component.html',
  styleUrl: './matter-detail.component.scss'
})
export class MatterDetailComponent implements OnInit {
  apiService = inject(ApiService);
  authService = inject(AuthService);
  route = inject(ActivatedRoute);

  matterId = '';
  matter = signal<any>(null);
  users = signal<any[]>([]);
  courts = signal<any[]>([]);
  activeTab = 'overview';

  // Modals
  showOutcomeModal = signal(false);
  showScheduleHearingModal = signal(false);
  showUploadModal = signal(false);
  showPhysicalDocModal = signal(false);
  showNewTaskModal = signal(false);
  showNewCommModal = signal(false);
  showFeeModal = signal(false);
  showExpenseModal = signal(false);
  showInvoiceModal = signal(false);
  showPaymentModal = signal(false);
  showNewCaseModal = signal(false);

  // Hearing outcome state
  selectedHearing: any = null;
  selectedCase: any = null;
  selectedInvoice: any = null;
  selectedFile: File | null = null;

  newCaseData: any = {
    courtId: '',
    officialCaseNumber: '',
    caseType: 'CIVIL_SUIT',
    clientRole: 'PLAINTIFF',
    opposingParty: '',
    opposingCounsel: '',
    filingDate: new Date().toISOString().split('T')[0],
    currentStage: 'FILING'
  };

  hearingScheduleData: any = {
    courtCaseId: '',
    hearingDate: new Date().toISOString().split('T')[0],
    hearingTime: '09:30 AM',
    purpose: 'CALLING',
    courtroom: 'Courtroom 01',
    judgeName: 'Presiding Judge',
    appearingAttorneyId: ''
  };

  feeData: any = {
    title: '',
    feeType: 'APPEARANCE_FEE',
    amount: 50000,
    date: new Date().toISOString().split('T')[0]
  };

  expenseData: any = {
    title: '',
    category: 'STAMP_FEE',
    amount: 1500,
    receiptRef: '',
    date: new Date().toISOString().split('T')[0]
  };

  invoiceData: any = {
    description: 'Professional Legal Representation & Retainer',
    amount: 50000,
    dueDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    notes: 'Payment due within 14 days of invoice date. Bank: Commercial Bank, A/C: 1000928371.'
  };

  commData: any = {
    type: 'PHONE_CALL',
    direction: 'OUTBOUND',
    subject: '',
    content: ''
  };

  hearingOutcomeData: any = {
    outcomeSummary: '',
    courtDirections: '',
    clientActionsRequired: '',
    staffActionsRequired: '',
    nextHearingDate: '',
    nextHearingPurpose: 'FURTHER_TRIAL',
    createFollowUpTasks: true
  };

  uploadData: any = {
    name: '',
    category: 'PLEADING'
  };

  physicalData: any = {
    title: '',
    documentType: 'TITLE_DEED',
    referenceNo: '',
    receivedFrom: '',
    physicalLocation: ''
  };

  newTaskData: any = {
    title: '',
    assignedToId: '',
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    description: ''
  };

  paymentData: any = {
    amount: 0,
    paymentMethod: 'BANK_TRANSFER',
    transactionRef: ''
  };

  ngOnInit() {
    this.matterId = this.route.snapshot.paramMap.get('id') || '';
    if (this.matterId) {
      this.loadMatter();
    }
    this.apiService.getUsers().subscribe({
      next: (res) => {
        if (res.success) {
          this.users.set(res.users || []);
          if (res.users?.length > 0) {
            this.newTaskData.assignedToId = res.users[0].id;
            this.hearingScheduleData.appearingAttorneyId = res.users[0].id;
          }
        }
      }
    });
    this.apiService.getCourts().subscribe({
      next: (res) => {
        if (res.success && res.courts?.length > 0) {
          this.courts.set(res.courts);
          this.newCaseData.courtId = res.courts[0].id;
        }
      }
    });
  }

  loadMatter() {
    this.apiService.getMatter(this.matterId).subscribe({
      next: (res) => {
        if (res.success) {
          this.matter.set(res.matter);
          if (res.matter?.agreedFee) {
            this.invoiceData.amount = Number(res.matter.agreedFee);
          }
        }
      }
    });
  }

  getHearingsCount(): number {
    const cases = this.matter()?.courtCases || [];
    return cases.reduce((acc: number, c: any) => acc + (c.hearings?.length || 0), 0);
  }

  getTotalFees(): number {
    const fees = this.matter()?.fees || [];
    return fees.reduce((acc: number, f: any) => acc + Number(f.amount || 0), 0);
  }

  getTotalExpenses(): number {
    const expenses = this.matter()?.expenses || [];
    return expenses.reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);
  }

  updateStage(stage: string) {
    this.apiService.updateMatterStatus(this.matterId, { stage }).subscribe({
      next: () => this.loadMatter()
    });
  }

  saveCourtCase() {
    if (!this.newCaseData.courtId || !this.newCaseData.officialCaseNumber) {
      alert('Please select a Court and enter the Official Case Number.');
      return;
    }
    this.apiService.createCourtCase({
      ...this.newCaseData,
      matterId: this.matterId
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.showNewCaseModal.set(false);
          this.loadMatter();
        }
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to register court case');
      }
    });
  }

  openScheduleHearingModal(caseItem: any) {
    this.selectedCase = caseItem;
    this.hearingScheduleData.courtCaseId = caseItem.id;
    this.hearingScheduleData.courtroom = caseItem.court?.courtroomNo || 'Main Court';
    this.hearingScheduleData.judgeName = caseItem.court?.judgeName || 'Hon. Judge';
    this.hearingScheduleData.appearingAttorneyId = this.matter()?.leadAttorneyId || (this.users()[0]?.id || '');
    this.showScheduleHearingModal.set(true);
  }

  saveScheduledHearing() {
    if (!this.hearingScheduleData.hearingDate || !this.hearingScheduleData.purpose) {
      alert('Hearing date and purpose are required.');
      return;
    }
    this.apiService.scheduleHearing({
      ...this.hearingScheduleData,
      courtCaseId: this.selectedCase?.id || this.hearingScheduleData.courtCaseId
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.showScheduleHearingModal.set(false);
          this.loadMatter();
        }
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to schedule hearing');
      }
    });
  }

  openOutcomeModal(hearing: any, caseItem: any) {
    this.selectedHearing = hearing;
    this.selectedCase = caseItem;
    this.hearingOutcomeData = {
      outcomeSummary: hearing.outcomeSummary || '',
      courtDirections: hearing.courtDirections || '',
      clientActionsRequired: hearing.clientActionsRequired || '',
      staffActionsRequired: hearing.staffActionsRequired || '',
      nextHearingDate: hearing.nextHearingDate ? new Date(hearing.nextHearingDate).toISOString().split('T')[0] : '',
      nextHearingPurpose: hearing.nextHearingPurpose || 'FURTHER_TRIAL',
      createFollowUpTasks: true
    };
    this.showOutcomeModal.set(true);
  }

  saveHearingOutcome() {
    if (!this.selectedHearing) return;
    this.apiService.recordHearingOutcome(this.selectedHearing.id, this.hearingOutcomeData).subscribe({
      next: (res) => {
        if (res.success) {
          this.showOutcomeModal.set(false);
          this.loadMatter();
        }
      }
    });
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      if (!this.uploadData.name) {
        this.uploadData.name = this.selectedFile?.name;
      }
    }
  }

  uploadDocument() {
    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }
    formData.append('name', this.uploadData.name);
    formData.append('category', this.uploadData.category);

    this.apiService.uploadDocument(this.matterId, formData).subscribe({
      next: () => {
        this.showUploadModal.set(false);
        this.loadMatter();
      }
    });
  }

  openVersionModal(doc: any) {
    alert(`Document "${doc.name}" has ${doc.versions?.length || 1} version(s).`);
  }

  savePhysicalDoc() {
    this.apiService.registerPhysicalDocument({
      ...this.physicalData,
      matterId: this.matterId
    }).subscribe({
      next: () => {
        this.showPhysicalDocModal.set(false);
        this.loadMatter();
      }
    });
  }

  openReturnModal(pDoc: any) {
    const person = prompt('Enter name of person to whom the original was returned:', pDoc.receivedFrom);
    if (person) {
      this.apiService.returnPhysicalDocument(pDoc.id, { returnedTo: person }).subscribe({
        next: () => this.loadMatter()
      });
    }
  }

  saveTask() {
    this.apiService.createTask({
      ...this.newTaskData,
      matterId: this.matterId
    }).subscribe({
      next: () => {
        this.showNewTaskModal.set(false);
        this.loadMatter();
      }
    });
  }

  completeTask(task: any) {
    this.apiService.updateTaskStatus(task.id, { status: 'COMPLETED' }).subscribe({
      next: () => this.loadMatter()
    });
  }

  saveFee() {
    if (!this.feeData.title || !this.feeData.amount) {
      alert('Please enter fee description and amount');
      return;
    }
    this.apiService.createMatterFee(this.matterId, this.feeData).subscribe({
      next: () => {
        this.showFeeModal.set(false);
        this.loadMatter();
      }
    });
  }

  saveExpense() {
    if (!this.expenseData.title || !this.expenseData.amount) {
      alert('Please enter expense description and amount');
      return;
    }
    this.apiService.createMatterExpense(this.matterId, this.expenseData).subscribe({
      next: () => {
        this.showExpenseModal.set(false);
        this.loadMatter();
      }
    });
  }

  saveInvoice() {
    if (!this.invoiceData.description || !this.invoiceData.amount) {
      alert('Please enter invoice description and amount');
      return;
    }
    this.apiService.createInvoice({
      matterId: this.matterId,
      clientId: this.matter()?.clientId,
      dueDate: this.invoiceData.dueDate,
      notes: this.invoiceData.notes,
      items: [
        {
          description: this.invoiceData.description,
          quantity: 1,
          unitPrice: Number(this.invoiceData.amount),
          amount: Number(this.invoiceData.amount)
        }
      ]
    }).subscribe({
      next: () => {
        this.showInvoiceModal.set(false);
        this.loadMatter();
      }
    });
  }

  saveCommunication() {
    if (!this.commData.subject || !this.commData.content) {
      alert('Please enter subject and message content');
      return;
    }
    this.apiService.createMatterCommunication(this.matterId, this.commData).subscribe({
      next: () => {
        this.showNewCommModal.set(false);
        this.loadMatter();
      }
    });
  }

  openPaymentModal(invoice: any) {
    this.selectedInvoice = invoice;
    this.paymentData.amount = Number(invoice.balanceDue);
    this.showPaymentModal.set(true);
  }

  submitPayment() {
    if (!this.selectedInvoice) return;
    this.apiService.recordPayment(this.selectedInvoice.id, this.paymentData).subscribe({
      next: () => {
        this.showPaymentModal.set(false);
        this.loadMatter();
        alert('Payment recorded and official receipt issued!');
      }
    });
  }
}
