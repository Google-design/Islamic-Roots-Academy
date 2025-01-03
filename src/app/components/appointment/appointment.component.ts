import { Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { addDoc, collection, doc, Firestore, getDoc, getDocs, query, where, serverTimestamp } from '@angular/fire/firestore';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';


import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { map, Observable } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { NgxStripeModule } from 'ngx-stripe';
import { ActivatedRoute, Router } from '@angular/router';

import { startOfDay } from 'date-fns';

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
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonToggleModule,
    NgxStripeModule,
    
  ],
  templateUrl: './appointment.component.html',
  styleUrl: './appointment.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class AppointmentComponent implements OnInit, AfterViewInit{
  @ViewChild('stepper', {static: false }) stepper!: MatStepper;
  isLinear: boolean = true;  // Default value for linear navigation
  services: any[] = [];
  stepperOrientation: Observable<'horizontal' | 'vertical'>;
  serviceSelectionForm: FormGroup;
  selectedServiceStaff: any[] = [];
  selectedStaff: any = null;
  selectedServiceUrl: string = '';
  selectedService: string = '';
  selectedDate: Date = new Date();
  availableTimes: { time: string; disabled: boolean }[] = [];
  today = startOfDay(new Date());
  selectedTime: any;
  bookedTimes: string[] = [];
  isLoading: boolean = false;
  isLoadingBookingDetails: boolean = false;
  confirmationDetails: any | null = null;
  selectedGender: string = '';            // Empty string means no filter
  filteredStaff: any[] = [];
  
  constructor(
    private firestore: Firestore,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
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
    if (this.stepper) {
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
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const step = params['step'];
      const selectedServiceName = params['serviceBooked'];
      const staffName = params['staffBooked'];
      const dateBooked = params['dateBooked'];
      const timeBooked = params['timeBooked'];
      const sessionId = params['checkout_session_id'];

      if (selectedServiceName) {
        this.selectedService = selectedServiceName;
      }
      if (staffName) {
        this.selectedStaff = staffName;
      }
      if (dateBooked) {
        this.selectedDate = dateBooked;
      }
      if (timeBooked) {
        this.selectedTime = timeBooked;
      }

      console.log("NG ONINT: " + this.selectedService + this.selectedStaff + this.selectedDate + this.selectedTime);

      if (sessionId) {
        this.verifyPayment(sessionId);
      }

      if (step && !isNaN(step)) {
        const index = Math.min(Math.max(+step - 1, 0), 4);
        this.isLinear = false;  // Disable linear navigation if a specific step is requested 
        setTimeout(() => {
          this.stepper.selectedIndex = 4; // Use a delay to make sure the stepper is initialized
          this.isLinear = true;
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
      this.filteredStaff = this.selectedServiceStaff;
      console.log('Staff for selected service:', this.selectedServiceStaff);  // Should log an array of strings

    } else {
      console.error('Service document not found!');
      this.selectedServiceStaff = [];
    }
  }

  // Function to handle staff selection
  onStaffSelect(staff: any) {
    this.selectedStaff = staff.name;
    console.log('Selected Staff:', staff);
  }

  // Function to retrieve initials of staff name
  getStaffInitials(staff: { name: string }): string {
    if (!staff || !staff.name) {
      return ''; // Return an empty string if name is undefined or null
    }
  
    return staff.name
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

  onGenderFilterChange(event: any): void {
    // Reapply the filter whenever the gender selection changes
    if (!this.selectedGender) {
      // No filter; display all staff
      this.filteredStaff = this.selectedServiceStaff;
    } else {
      // Filter staff based on the selected gender
      this.filteredStaff = this.selectedServiceStaff.filter(staff => staff.gender === this.selectedGender);
    }
  }  

  // Step 3
  dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
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
    this.selectedDate = date;
    const teamMemberName = this.selectedStaff;    // teamMember = staff
    try {
      // Querying bookings for selected staff and date
      const selectedDateString = date.toISOString().split('T')[0];
      const bookingsCollection = collection(this.firestore, 'bookings');
      const bookingsQuery = query(
        bookingsCollection,
        where('staffBooked', '==', teamMemberName),
        where('timeBooked', '>=', new Date(selectedDateString)),
        where('timeBooked', '<', new Date(selectedDateString + 'T23:59:59'))
      );
      const snapshot = await getDocs(bookingsQuery);
      this.bookedTimes = snapshot.docs.map(doc => {
        const bookingData = doc.data();
        return new Date(bookingData['timeBooked'].seconds * 1000).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      });

      // Getting available times for the selected staff
      const teamMemberData = await this.getTeamMemberAvailability(teamMemberName);
      // Filter out empty strings or invalid times
      const availableTimesForDay = (teamMemberData?.['availability']?.[selectedDay] || [])
        .filter((time: string) => time.trim() !== "");

      // Flagging booked times
      this.availableTimes = availableTimesForDay.map((actualTime: string) => ({
        time: actualTime,
        disabled: this.bookedTimes.includes(actualTime), // Mark times as disabled if already booked
      }));

      } catch(error) {
      console.error('Error fetching availability:', error);
      this.availableTimes = [];
    }
    console.log('Available Times After Fetch:', this.availableTimes);
  }

  selectTime(time: string) {
    this.selectedTime = time;
    console.log('Selected time:', time);
  }

  // Step 4
  redirectToStripeCheckout(): void {
    this.isLoading = true;
    console.log("All fields: " + JSON.stringify(this.serviceSelectionForm.value.selectedService) + " " + this.selectedStaff + " " + this.selectedDate.toISOString().split('T')[0] + " " + this.selectedTime);

    if (this.serviceSelectionForm.value.selectedService.name && this.selectedStaff && this.selectedDate && this.selectedTime) {
      const amount = this.serviceSelectionForm.value.selectedService.price;
      const description = this.serviceSelectionForm.value.selectedService.description;
      const productImageUrl = this.serviceSelectionForm.value.selectedService.productImageUrl;
      if (amount === 0) {
        this.isLoading = false;
        console.error("Invalid service selected.");
        return;
      }

      const payload = {
        serviceBooked: this.serviceSelectionForm.value.selectedService.name,
        amount: amount,
        productImageUrl: productImageUrl,
        description: description,
        staffBooked: this.selectedStaff,
        dateBooked: this.selectedDate.toISOString().split('T')[0],
        timeBooked: this.selectedTime,
      };

      // API Hit
      const stripePaymentApiUrl = "https://q1z2uksjy7.execute-api.us-east-2.amazonaws.com/stripePaymentLinks"
      fetch(stripePaymentApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then((response) => {
          if(!response.ok){
            this.isLoading = false;
            throw new Error("Failed to fetch Stripe Checkout URL.");
          }
          return response.json();
        })
        .then((data) => {
          if (data.payment_link){
            this.isLoading = false;
            console.log("Redirecting to Stripe Checkout URL: " + data.payment_link);
            window.location.href = data.payment_link; // Redirecting to the Stripe Checkout URL
          } else {
            this.isLoading = false;
            console.error("Stripe Checkout URL not received.");
          }
        })
        .catch((error) => {
          this.isLoading = false;
          console.error("Error:", error);
        })
    } else {
      this.isLoading = false;
      console.error("Service, staff, or date/time not selected.");
    }  
  }

  // Step 5
  // Hit the api to check the payment status and then create the docuemnt
  verifyPayment(sessionId: string): void {
    const verifyPaymentApiUrl = "https://gwk9rgbthi.execute-api.us-east-2.amazonaws.com/dev/verifyPayment";

    this.isLoadingBookingDetails = true;
    this.cdr.detectChanges();
    
    fetch(verifyPaymentApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Payment verification failed.");
        }
        return response.json();
      })
      .then((data) => {
        if(data.session.payment_status === "paid") {
          console.log("Payment verified successfully:", data);
          const customerName = data.session.customer_details.name;
          const customerEmail = data.session.customer_details.email;
          const customerSessionId = data.session.id;
          this.createAppointmentDocument(customerName, customerEmail, customerSessionId);
        } else {
          console.error("Payment not completed. Status:", data.session?.payment_status);
          this.isLoadingBookingDetails = false;
          // Payment not complete cases
        }
      })
      .catch((error) => {
        console.error("Error during payment verification:", error);
        this.isLoadingBookingDetails = false;
      })
  }


  async createAppointmentDocument(customerName: string, customerEmail: string, customerSessionId: string) {
    const bookingDate = new Date(`${this.selectedDate} ${this.selectedTime}`);

    const bookingsCollection = collection(this.firestore, 'bookings');
    const bookingData = {
      serviceBooked: this.selectedService,
      staffBooked: this.selectedStaff,
      userName: customerName,
      userEmail: customerEmail,
      timeBooked: bookingDate,
      sessionId: customerSessionId.slice(-9),
      createdAt: serverTimestamp()
    };

    try{
      const docRef = await addDoc(bookingsCollection, bookingData);
      console.log('Booking data saved:', docRef.id);

      // Store details in confirmationDetails
      this.confirmationDetails = {
        docRefId: docRef.id,
        ...bookingData,
        bookingDate
      };
    } catch (error) {
      console.error('Error saving booking data: ', error);
      throw error;
    } finally {
      this.isLoadingBookingDetails = false;
    }
  }

}
