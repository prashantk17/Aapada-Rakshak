"""
firebase/seed_data.py — Seed initial data into Firestore
Run once to populate your Firebase database with sample data.

Usage:
  cd firebase
  pip install firebase-admin --break-system-packages
  # Place firebase-service-account.json in this directory
  python seed_data.py
"""

import firebase_admin
from firebase_admin import credentials, firestore
import os, sys

service_account = os.path.join(os.path.dirname(__file__), '..', 'backend', 'firebase-service-account.json')
if not os.path.exists(service_account):
    print("❌ firebase-service-account.json not found in backend/")
    print("   Download from Firebase Console → Project Settings → Service Accounts")
    sys.exit(1)

cred = credentials.Certificate(service_account)
firebase_admin.initialize_app(cred)
db = firestore.client()

print("🌱 Seeding Firestore database...")

# Disasters
disasters = [
    {"type": "Landslide", "severity": "High", "lat": 30.7333, "lng": 77.1167, "radius": 5000,
     "description": "Active landslide zone. Heavy rainfall causing debris flow.", "location_name": "Shimla Hills, Himachal Pradesh", "active": True, "timestamp": "2024-08-12T10:30:00Z"},
    {"type": "Flood", "severity": "High", "lat": 25.5941, "lng": 85.1376, "radius": 8000,
     "description": "Severe flooding. Water levels rising rapidly in low-lying areas.", "location_name": "Patna, Bihar", "active": True, "timestamp": "2024-08-20T14:15:00Z"},
    {"type": "Earthquake", "severity": "Medium", "lat": 34.0837, "lng": 74.7973, "radius": 15000,
     "description": "5.2 magnitude earthquake. Aftershocks possible.", "location_name": "Srinagar, Kashmir", "active": True, "timestamp": "2024-09-18T06:45:00Z"},
    {"type": "Fire", "severity": "Medium", "lat": 11.6643, "lng": 76.7213, "radius": 3000,
     "description": "Forest fire spreading westward. Air quality poor.", "location_name": "Nilgiris, Tamil Nadu", "active": True, "timestamp": "2024-04-10T12:00:00Z"},
    {"type": "Storm", "severity": "High", "lat": 13.0827, "lng": 80.2707, "radius": 20000,
     "description": "Cyclone warning. Wind speed 120 km/h.", "location_name": "Chennai Coast, Tamil Nadu", "active": True, "timestamp": "2024-11-25T08:00:00Z"},
]

shelters = [
    {"name": "Rajiv Gandhi Community Hall", "lat": 30.7290, "lng": 77.1200, "capacity": 500, "current_occupancy": 120, "contact": "+91-177-2812345", "contact_person": "Ramesh Kumar", "supplies": ["Food", "Water", "Blankets", "Medicine"], "type": "Evacuation Center"},
    {"name": "District Medical Relief Camp", "lat": 25.5890, "lng": 85.1450, "capacity": 300, "current_occupancy": 89, "contact": "+91-612-2234567", "contact_person": "Dr. Priya Singh", "supplies": ["Medical Aid", "Food", "Water"], "type": "Medical Camp"},
    {"name": "Govt. School Emergency Shelter", "lat": 34.0780, "lng": 74.8020, "capacity": 800, "current_occupancy": 200, "contact": "+91-194-2450678", "contact_person": "Abdul Hamid", "supplies": ["Food", "Water", "Blankets"], "type": "Evacuation Center"},
]

volunteers = [
    {"name": "Arjun Sharma", "lat": 30.7310, "lng": 77.1150, "skills": ["First Aid", "Search & Rescue"], "availability": True, "supplies": ["First Aid Kit", "Rope"], "contact": "+91-9876543210", "rating": 4.8, "missions_completed": 12, "user_id": ""},
    {"name": "Priya Patel", "lat": 25.5960, "lng": 85.1400, "skills": ["Medical", "Food Distribution"], "availability": True, "supplies": ["Medicine", "Food Packets"], "contact": "+91-9765432109", "rating": 4.9, "missions_completed": 25, "user_id": ""},
    {"name": "Anjali Gupta", "lat": 13.0850, "lng": 80.2750, "skills": ["First Aid", "Counseling"], "availability": True, "supplies": ["First Aid Kit", "Blankets"], "contact": "+91-9543210987", "rating": 4.7, "missions_completed": 18, "user_id": ""},
]

relief_posts = [
    {"volunteer_id": "seed", "volunteer_name": "Arjun Sharma", "description": "Distributed 200 food packets to flood-affected families in Sector 4.", "location_name": "Sector 4, Shimla", "lat": 30.7320, "lng": 77.1155, "supply_type": "Food", "timestamp": "2024-08-12T15:30:00Z", "likes": 45},
    {"volunteer_id": "seed", "volunteer_name": "Priya Patel", "description": "Medical camp operational at Rajiv Gandhi Hall. Treated 85 patients.", "location_name": "Patna Relief Zone", "lat": 25.5950, "lng": 85.1390, "supply_type": "Medicine", "timestamp": "2024-08-20T18:00:00Z", "likes": 72},
]

collections = [
    ('disasters', disasters),
    ('shelters', shelters),
    ('volunteers', volunteers),
    ('relief_posts', relief_posts),
]

for col_name, docs in collections:
    print(f"  📝 Seeding {col_name}...")
    for doc in docs:
        db.collection(col_name).add(doc)
    print(f"     ✅ Added {len(docs)} documents")

print("\n🎉 Seeding complete! Your Firestore database is ready.")