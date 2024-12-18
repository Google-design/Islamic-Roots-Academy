import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { collection, Firestore, getDocs } from '@angular/fire/firestore';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatStepperModule} from '@angular/material/stepper';
import {MatButtonModule} from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';


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
  ],
  templateUrl: './appointment.component.html',
  styleUrl: './appointment.component.scss'
})
export class AppointmentComponent implements OnInit{
  services: any[] = [];

  constructor(private firestore: Firestore) { }

  ngOnInit(): void {
    this.fetchServices();
  }

  async fetchServices() {
    const servicesCollection = collection(this.firestore, 'services');
    const snapshot = await getDocs(servicesCollection);
    this.services = snapshot.docs.map(doc => doc.data());    
  }

  onServiceClick(service: any) {
    console.log('Service Clicked:', service.name);
    // You can navigate or handle any action here
  }
  // private _formBuilder = inject(FormBuilder);

  // firstFormGroup = this._formBuilder.group({
  //   firstCtrl: ['', Validators.required],
  // });
  // secondFormGroup = this._formBuilder.group({
  //   secondCtrl: ['', Validators.required],
  // });
  // isLinear = false;
}
