import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { collection, Firestore, getDocs } from '@angular/fire/firestore';

@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [CommonModule],
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

}
