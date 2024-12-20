import { Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA, ViewChild, AfterViewInit } from '@angular/core';
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

import { addDays, isBefore, isSameDay, startOfDay } from 'date-fns';

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

export class AppointmentComponent implements OnInit, AfterViewInit{
  @ViewChild('stepper') stepper!: MatStepper;
  isLinear: boolean = true;  // Default value for linear navigation
  services: any[] = [];
  stepperOrientation: Observable<'horizontal' | 'vertical'>;
  serviceSelectionForm: FormGroup;
  selectedServiceStaff: any[] = [];
  selectedStaff: any = null;
  selectedServiceUrl: string = '';

  selectedDate: Date | null = new Date();
  availableTimes: string[] = [];
  today = startOfDay(new Date());
  
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

  ngAfterViewInit(): void {
    // Now the stepper is available, subscribe to selectionChange
    this.stepper.selectionChange.subscribe((event) => {
      const selectedIndex = event.selectedIndex;

      // Ensure the user cannot skip steps if not valid
      if (selectedIndex > this.stepper.selectedIndex && !this.isStepValid(this.stepper.selectedIndex)) {
        // Prevent navigating forward if the current step is invalid
        this.stepper.selectedIndex = this.stepper.selectedIndex;
      }
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const step = params['step'];
      if (step && !isNaN(step)) {
        const index = Math.min(Math.max(+step - 1, 0), 4);
        this.isLinear = false;  // Disable linear navigation if a specific step is requested 
        setTimeout(() => {
          this.stepper.selectedIndex = index; // Use a delay to make sure the stepper is initialized
        });
      }
    });
  }


  // Function to check if the current step is valid
  isStepValid(stepIndex: number): boolean {
    if (stepIndex === 0) {
      return this.serviceSelectionForm.valid; // Example for Step 1 validation
    }
    if (stepIndex === 1) {
      return this.selectedStaff !== null; // Example for Step 2 validation
    }
    return true; // For other steps, return true
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

  triggerDateChange() {
    if (!this.selectedDate) {
      console.warn('No date selected!');
      return;
    }
    this.onDateChange(this.selectedDate);
  }

  // Step 3
  dateFilter = (date: Date | null): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoMonthsLater = new Date();
    twoMonthsLater.setMonth(today.getMonth() + 2);
    twoMonthsLater.setHours(0, 0, 0, 0);
  
    return !!date && date >= today && date <= twoMonthsLater; // Allow only dates within range
  };

  async getTeamMemberAvailability(teamMemberName: string){
    const docRef = doc(this.firestore, `team_members/${teamMemberName}`);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  }
  
  async onDateChange(date: Date | null) {
    if (!date) {
      this.availableTimes = [];
      return;
    } // Handle null case

    const selectedDay = date.toLocaleDateString('en-US', { weekday: 'long' }); // e.g., "Monday"
    console.log("Selected Day = " + selectedDay);
    console.log('Available Times Before Fetch:', this.availableTimes);

    this.selectedDate = date;
    console.log("Selected Date = " + this.selectedDate);
    const teamMemberName = this.selectedStaff;    // teamMember = staff
    try {
      const teamMemberData = await this.getTeamMemberAvailability(teamMemberName);
      this.availableTimes = teamMemberData?.['availability']?.[selectedDay] || [];
    } catch(error) {
      console.error('Error fetching availability:', error);
      this.availableTimes = [];
    }
    console.log('Available Times After Fetch:', this.availableTimes);
  }

  selectTime(time: string) {
    console.log('Selected time:', time);
  }

  // Step 4
  redirectToStripeCheckout(): void {
    if (this.selectedServiceUrl) {
      window.location.href = this.selectedServiceUrl; // Redirect to the appropriate Stripe Checkout URL
    } else {
      console.error('No service selected or service URL not set.');
    }
  }
}
