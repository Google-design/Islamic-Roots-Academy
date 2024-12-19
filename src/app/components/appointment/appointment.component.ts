import { Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { collection, doc, Firestore, getDoc, getDocs } from '@angular/fire/firestore';

import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatStepper, MatStepperModule} from '@angular/material/stepper';
import {MatButtonModule} from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {MatRadioModule} from '@angular/material/radio'

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { map, Observable } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { NgxStripeModule } from 'ngx-stripe';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [
    CommonModule, 
    MatInputModule,
    MatFormFieldModule,
    MatStepperModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    NgxStripeModule,
  ],
  templateUrl: './appointment.component.html',
  styleUrl: './appointment.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class AppointmentComponent implements OnInit{
  @ViewChild('stepper') stepper!: MatStepper;
  services: any[] = [];
  stepperOrientation: Observable<'horizontal' | 'vertical'>;
  serviceSelectionForm: FormGroup;
  selectedServiceStaff: any[] = [];
  selectedStaff: any = null;
  selectedServiceUrl: string = '';
  
  constructor(
    private firestore: Firestore,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    
    // Step 1
    this.fetchServices();
    this.serviceSelectionForm = this.fb.group({
      selectedService: [null, Validators.required],
    });

    // Responsiveness
    const breakpointObserver = inject(BreakpointObserver);
    this.stepperOrientation = breakpointObserver
      .observe('(min-width: 800px)')
      .pipe(map(({ matches }) => (matches ? 'horizontal' : 'vertical')));
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const step = params['step'];
      if (step && !isNaN(step)) {
        this.stepper.selectedIndex = +step - 1; // Set to step 5 (index 4)
      }
    });
  }

  // Step 1
  async fetchServices() {
    const servicesCollection = collection(this.firestore, 'services');
    const snapshot = await getDocs(servicesCollection);
    this.services = snapshot.docs.map(doc => doc.data());    
  }

  // Step 2
  async onServiceClick(service: any) {
    console.log("Service clicked: " + service.name);
    const serviceDocRef = doc(this.firestore, 'services', service.name);
    const serviceDocSnap = await getDoc(serviceDocRef);

    if (serviceDocSnap.exists()) {
      const serviceData = serviceDocSnap.data();
      this.selectedServiceStaff = serviceData['teamMembers'] || [];
      console.log('Staff for selected service:', this.selectedServiceStaff);  // Should log an array of strings

      // Step 3: Redirect logic based on selected service
      if (service.name === 'Quran Classes') {
        this.selectedServiceUrl = 'https://book.stripe.com/test_28o17M9tK6gggwg000'; // URL for Service 1
      } else if (service.name === 'Aqeedah Classes') {
        this.selectedServiceUrl = 'https://book.stripe.com/test_9AQeYC7lCgUUfsceUV'; // URL for Service 2
      }

    } else {
      console.error('Service document not found!');
      this.selectedServiceStaff = [];
    }
  }

  // Function to handle staff selection
  onStaffSelect(staff: any) {
    this.selectedStaff = staff;
    console.log('Selected Staff:', staff);
  }

  // Function to retrieve initials of staff name
  getStaffInitials(name: string): string {
    if (!name) {
      return ''; // Return an empty string if name is undefined or null
    }
  
    return name
      .split(' ') // Split the string into words
      .map(word => word[0]) // Take the first letter of each word
      .filter(char => char) // Filter out any undefined or empty values
      .join('') // Join the initials together
      .toUpperCase();
  }

  // Step 3
  redirectToStripeCheckout(): void {
    if (this.selectedServiceUrl) {
      window.location.href = this.selectedServiceUrl; // Redirect to the appropriate Stripe Checkout URL
    } else {
      console.error('No service selected or service URL not set.');
    }
  }
}
