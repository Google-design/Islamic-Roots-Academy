import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { collection, doc, Firestore, getDoc, getDocs } from '@angular/fire/firestore';

import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatStepperModule} from '@angular/material/stepper';
import {MatButtonModule} from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {MatRadioModule} from '@angular/material/radio'

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { map, Observable } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';

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
  ],
  templateUrl: './appointment.component.html',
  styleUrl: './appointment.component.scss'
})

export class AppointmentComponent implements OnInit{
  services: any[] = [];
  stepperOrientation: Observable<'horizontal' | 'vertical'>;
  serviceSelectionForm: FormGroup;
  selectedServiceStaff: any[] = [];
  selectedStaff: any = null;
  

  constructor(private firestore: Firestore, private fb: FormBuilder) {
    
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

  }

  // Step 1
  async fetchServices() {
    const servicesCollection = collection(this.firestore, 'services');
    const snapshot = await getDocs(servicesCollection);
    this.services = snapshot.docs.map(doc => doc.data());    
  }

  // Step 2
  async onServiceClick(service: any) {
    const serviceDocRef = doc(this.firestore, 'services', service.name);
    const serviceDocSnap = await getDoc(serviceDocRef);

    if (serviceDocSnap.exists()) {
      const serviceData = serviceDocSnap.data();
      this.selectedServiceStaff = serviceData['teamMembers'] || [];
      console.log('Staff for selected service:', this.selectedServiceStaff);  // Should log an array of strings
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
}
