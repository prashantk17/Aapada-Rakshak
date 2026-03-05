"""
app.py — Aapada Rakshak Flask Backend
Real-time Disaster Management API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone
import os
import json
from ml_predictor import get_predictor
from dotenv import load_dotenv
import math

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

# ─── Firebase Initialization ───────────────────────────────────────────────────
db = None
try:
    service_account_path = os.path.join(os.path.dirname(__file__), 'firebase-service-account.json')
    if os.path.exists(service_account_path):
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("[Firebase] Connected to Firestore ✓")
    else:
        print("[Firebase] ⚠ Service account not found. Using mock data mode.")
except Exception as e:
    print(f"[Firebase] Connection error: {e}")
    print("[Firebase] Running in DEMO mode with mock data")


# ─── Mock Data (for demo without Firebase) ────────────────────────────────────
MOCK_DISASTERS = [
    {"id":"d1","type":"Landslide","severity":"High","lat":30.7333,"lng":77.1167,"radius":5000,"description":"Active landslide zone. Heavy continuous rainfall triggering debris flows on NH-5. Evacuate immediately — do NOT enter affected zone.","timestamp":"2024-08-12T10:30:00Z","active":True,"location_name":"Shimla Hills, Himachal Pradesh"},
    {"id":"d2","type":"Flood","severity":"High","lat":25.5941,"lng":85.1376,"radius":8000,"description":"Ganga overflowing banks. Water levels at 48.2m, danger mark is 48.8m. All low-lying colonies under alert. Immediate evacuation of riverside settlements ordered.","timestamp":"2024-08-20T14:15:00Z","active":True,"location_name":"Patna, Bihar"},
    {"id":"d3","type":"Earthquake","severity":"Medium","lat":34.0837,"lng":74.7973,"radius":15000,"description":"5.2 magnitude earthquake at 10km depth. Multiple aftershocks recorded. Avoid old structures and brick buildings. Check for gas leaks.","timestamp":"2024-09-18T06:45:00Z","active":True,"location_name":"Srinagar, Kashmir"},
    {"id":"d4","type":"Fire","severity":"Medium","lat":11.6643,"lng":76.7213,"radius":3000,"description":"Forest fire spreading westward in Mudumalai buffer zone. Wind speed 35 km/h. AQI critically high. Evacuate villages within 5km radius.","timestamp":"2024-04-10T12:00:00Z","active":True,"location_name":"Nilgiris, Tamil Nadu"},
    {"id":"d5","type":"Storm","severity":"High","lat":13.0827,"lng":80.2707,"radius":20000,"description":"Cyclone Michaung making landfall. Wind speed 120 km/h. Storm surge of 1.5m expected. All fishing activity suspended. Coastal belt evacuation mandatory.","timestamp":"2024-11-25T08:00:00Z","active":True,"location_name":"Chennai Coast, Tamil Nadu"},
    {"id":"d6","type":"Landslide","severity":"Low","lat":27.4728,"lng":94.9120,"radius":2000,"description":"Minor debris flow on hillside. Road partially blocked near km-34. One lane operational. Vigilance advised during rain.","timestamp":"2024-06-30T16:30:00Z","active":True,"location_name":"Dibrugarh, Assam"},
    {"id":"d7","type":"Flood","severity":"High","lat":26.1445,"lng":91.7362,"radius":12000,"description":"Brahmaputra river breaching embankments at Numaligarh and Golaghat. Over 40,000 people displaced. 200+ villages inundated. NDRF deployed.","timestamp":"2024-07-15T09:00:00Z","active":True,"location_name":"Golaghat, Assam"},
    {"id":"d8","type":"Earthquake","severity":"High","lat":28.6139,"lng":77.2090,"radius":25000,"description":"6.1 magnitude earthquake. Epicentre 15km NNW of Rohtak. Felt strongly across NCR region. Multiple buildings with structural damage. Avoid damaged structures.","timestamp":"2024-03-05T04:22:00Z","active":True,"location_name":"NCR Delhi Region"},
    {"id":"d9","type":"Storm","severity":"Medium","lat":20.2961,"lng":85.8245,"radius":18000,"description":"Cyclonic storm with winds up to 80 km/h approaching Puri coast. Heavy rain forecast for next 48 hours. Low-lying coastal areas on alert.","timestamp":"2024-10-22T11:30:00Z","active":True,"location_name":"Puri, Odisha"},
    {"id":"d10","type":"Fire","severity":"High","lat":30.0668,"lng":79.0193,"radius":4000,"description":"Major forest fire in Kedarnath Wildlife Sanctuary. Over 800 hectares burned. Wind fanning flames northward. Tourist evacuation in progress.","timestamp":"2024-05-08T14:00:00Z","active":True,"location_name":"Rudraprayag, Uttarakhand"},
    {"id":"d11","type":"Flood","severity":"Medium","lat":22.5726,"lng":88.3639,"radius":6000,"description":"Waterlogging in low-lying areas following 180mm rainfall in 24hrs. Drainage system overwhelmed. Avoid underpasses and subways. Emergency pumps deployed.","timestamp":"2024-08-05T07:45:00Z","active":True,"location_name":"Kolkata, West Bengal"},
    {"id":"d12","type":"Landslide","severity":"High","lat":27.3314,"lng":88.6138,"radius":3500,"description":"NH-10 blocked by massive landslide near 29th Mile. Sikkim completely cut off by road. Army helicopters deployed for rescue. 12 vehicles buried.","timestamp":"2024-09-03T03:15:00Z","active":True,"location_name":"Gangtok, Sikkim"},
    {"id":"d13","type":"Earthquake","severity":"Low","lat":23.0225,"lng":72.5714,"radius":8000,"description":"3.8 magnitude tremor recorded. No structural damage reported. Minor shaking felt in upper floors. Precautionary checks underway.","timestamp":"2024-11-14T22:10:00Z","active":True,"location_name":"Ahmedabad, Gujarat"},
    {"id":"d14","type":"Storm","severity":"High","lat":16.5062,"lng":80.6480,"radius":22000,"description":"Cyclone Asna — Category 3. Making landfall near Machilipatnam. Winds 140 km/h, storm surge 2m. Mandatory evacuation for 500,000 coastal residents.","timestamp":"2024-09-01T06:00:00Z","active":True,"location_name":"Krishna District, Andhra Pradesh"},
    {"id":"d15","type":"Flood","severity":"High","lat":23.1765,"lng":75.7885,"radius":9000,"description":"Narmada dam releasing 8 lakh cusecs. Downstream villages on red alert. Flood water expected in Barwaha town by evening. 60+ villages under evacuation order.","timestamp":"2024-08-28T16:00:00Z","active":True,"location_name":"Barwaha, Madhya Pradesh"},
    {"id":"d16","type":"Fire","severity":"Medium","lat":26.4499,"lng":74.6399,"radius":2500,"description":"Industrial fire at chemical storage facility. Toxic fumes reported. 2km exclusion zone in effect. Do NOT use open water sources. Wear masks.","timestamp":"2024-07-20T11:15:00Z","active":True,"location_name":"Ajmer, Rajasthan"},
    {"id":"d17","type":"Landslide","severity":"Medium","lat":31.1048,"lng":77.1734,"radius":3000,"description":"Road cave-in at Rampur-Shimla highway. 400m stretch damaged. Alternate route via Narkanda advised. PWD repair team on site.","timestamp":"2024-08-18T08:30:00Z","active":True,"location_name":"Rampur, Himachal Pradesh"},
    {"id":"d18","type":"Flood","severity":"Medium","lat":17.3850,"lng":78.4867,"radius":5000,"description":"Musi river overflow. Several low-lying areas including Amberpet and Malakpet flooded. GHMC rescue teams deployed. Relief camps set up in schools.","timestamp":"2024-09-10T20:30:00Z","active":True,"location_name":"Hyderabad, Telangana"},
    {"id":"d19","type":"Earthquake","severity":"Medium","lat":30.9010,"lng":79.1530,"radius":12000,"description":"4.9 magnitude quake near Joshimath. Fresh cracks reported in 120+ houses. Subsidence monitoring active. Residents in Zone A asked to vacate.","timestamp":"2024-01-10T02:45:00Z","active":True,"location_name":"Joshimath, Uttarakhand"},
    {"id":"d20","type":"Storm","severity":"Low","lat":8.5241,"lng":76.9366,"radius":10000,"description":"Low pressure system bringing heavy rain to coastal Kerala. Orange alert in Thiruvananthapuram, Kollam and Pathanamthitta. Fishermen warned not to venture out.","timestamp":"2024-10-18T14:00:00Z","active":True,"location_name":"Thiruvananthapuram, Kerala"},
]

MOCK_SHELTERS = [
    {"id":"s1","name":"Rajiv Gandhi Community Hall","lat":30.7290,"lng":77.1200,"capacity":500,"current_occupancy":312,"contact":"+91-177-2812345","contact_person":"Ramesh Kumar","supplies":["Food","Water","Blankets","Medicine","Generator"],"type":"Evacuation Center"},
    {"id":"s2","name":"District Medical Relief Camp — Patna","lat":25.5890,"lng":85.1450,"capacity":300,"current_occupancy":189,"contact":"+91-612-2234567","contact_person":"Dr. Priya Singh","supplies":["Medical Aid","Food","Water","ICU Support","Oxygen"],"type":"Medical Camp"},
    {"id":"s3","name":"Govt. Boys Higher Secondary School","lat":34.0780,"lng":74.8020,"capacity":800,"current_occupancy":420,"contact":"+91-194-2450678","contact_person":"Abdul Hamid","supplies":["Food","Water","Blankets","Sanitation"],"type":"Evacuation Center"},
    {"id":"s4","name":"Forest Dept. Relief Station — Ooty","lat":11.6700,"lng":76.7300,"capacity":150,"current_occupancy":55,"contact":"+91-423-2234500","contact_person":"Suresh Babu","supplies":["Masks","Water","First Aid","Anti-pollution Kits"],"type":"Relief Station"},
    {"id":"s5","name":"Chennai Port Trust Emergency Facility","lat":13.0900,"lng":80.2800,"capacity":1200,"current_occupancy":780,"contact":"+91-44-25360123","contact_person":"Lakshmi Rao","supplies":["Food","Water","Blankets","Medicine","Generator","Boats"],"type":"Emergency Facility"},
    {"id":"s6","name":"NDRF Relief Camp — Golaghat","lat":26.1500,"lng":91.7400,"capacity":600,"current_occupancy":540,"contact":"+91-376-2232100","contact_person":"Bhupen Borah","supplies":["Food","Water","Medicine","Boats","Life Jackets"],"type":"Evacuation Center"},
    {"id":"s7","name":"Army Flood Relief Camp — Puri","lat":19.8135,"lng":85.8312,"capacity":1000,"current_occupancy":230,"contact":"+91-6752-223456","contact_person":"Col. R.K. Mishra","supplies":["Food","Water","Blankets","Medicine","Helicopter Pad"],"type":"Army Camp"},
    {"id":"s8","name":"Kedarnath Base Camp Medical Aid","lat":30.0700,"lng":79.0220,"capacity":200,"current_occupancy":90,"contact":"+91-1364-233456","contact_person":"Dr. Asha Rawat","supplies":["Medical Aid","Oxygen","Food","Warm Clothes"],"type":"Medical Camp"},
    {"id":"s9","name":"YMCA Emergency Shelter — Kolkata","lat":22.5650,"lng":88.3590,"capacity":400,"current_occupancy":60,"contact":"+91-33-22823025","contact_person":"Sanjay Biswas","supplies":["Food","Water","Blankets","Sanitation"],"type":"Evacuation Center"},
    {"id":"s10","name":"Gangtok Sports Complex Relief Zone","lat":27.3340,"lng":88.6120,"capacity":900,"current_occupancy":720,"contact":"+91-3592-202034","contact_person":"Dawa Sherpa","supplies":["Food","Water","Blankets","Medicine","Warm Clothes","Generator"],"type":"Evacuation Center"},
    {"id":"s11","name":"SDRF Camp — Barwaha","lat":22.2500,"lng":76.0350,"capacity":350,"current_occupancy":290,"contact":"+91-7282-234567","contact_person":"Mohan Verma","supplies":["Food","Water","Rescue Boats","Life Jackets"],"type":"Relief Station"},
    {"id":"s12","name":"Red Cross Centre — Hyderabad","lat":17.3900,"lng":78.4900,"capacity":500,"current_occupancy":165,"contact":"+91-40-27015745","contact_person":"Sameera Shaikh","supplies":["Food","Water","Medicine","Counseling","Sanitation"],"type":"Medical Camp"},
    {"id":"s13","name":"Disaster Mgmt. Hub — Ahmedabad","lat":23.0300,"lng":72.5800,"capacity":800,"current_occupancy":40,"contact":"+91-79-25506250","contact_person":"Hardik Shah","supplies":["Food","Water","Blankets","Tents","Generator"],"type":"Evacuation Center"},
    {"id":"s14","name":"Cyclone Shelter — Machilipatnam","lat":16.1800,"lng":81.1400,"capacity":2000,"current_occupancy":1540,"contact":"+91-8672-223300","contact_person":"P. Venkateswara Rao","supplies":["Food","Water","Blankets","Medicine","Boats","Generator"],"type":"Emergency Facility"},
    {"id":"s15","name":"ITI Campus Relief Camp — Ajmer","lat":26.4600,"lng":74.6450,"capacity":250,"current_occupancy":30,"contact":"+91-145-2627412","contact_person":"Kavita Mathur","supplies":["Food","Water","Masks","Anti-pollution Kits","Decon Showers"],"type":"Relief Station"},
    {"id":"s16","name":"Joshimath Transit Shelter","lat":30.5520,"lng":79.5650,"capacity":300,"current_occupancy":195,"contact":"+91-1389-222001","contact_person":"Ratan Singh Rawat","supplies":["Food","Water","Warm Clothes","Blankets","Medicine"],"type":"Evacuation Center"},
    {"id":"s17","name":"Thiruvananthapuram Community Hall","lat":8.5100,"lng":76.9500,"capacity":400,"current_occupancy":45,"contact":"+91-471-2332115","contact_person":"Anitha Nair","supplies":["Food","Water","Sanitation","First Aid"],"type":"Evacuation Center"},
    {"id":"s18","name":"Srinagar Medical College Relief Ward","lat":34.0900,"lng":74.8100,"capacity":600,"current_occupancy":210,"contact":"+91-194-2401013","contact_person":"Dr. Mushtaq Bhat","supplies":["Medical Aid","ICU","Oxygen","Blood Bank","Food"],"type":"Medical Camp"},
    {"id":"s19","name":"Civil Defence Camp — Rampur","lat":31.4500,"lng":77.6300,"capacity":180,"current_occupancy":88,"contact":"+91-1902-233451","contact_person":"Sushma Thakur","supplies":["Food","Water","Blankets","Rescue Equipment"],"type":"Relief Station"},
    {"id":"s20","name":"Stadium Ground Camp — Delhi","lat":28.6200,"lng":77.2200,"capacity":5000,"current_occupancy":120,"contact":"+91-11-23392334","contact_person":"Vikram Singh","supplies":["Food","Water","Blankets","Medicine","Generator","Tents","Sanitation"],"type":"Emergency Facility"},
]

MOCK_VOLUNTEERS = [
    {"id":"v1","name":"Arjun Sharma","lat":30.7310,"lng":77.1150,"skills":["First Aid","Search & Rescue","Rope Rescue"],"availability":True,"supplies":["First Aid Kit","Rope","Harness","Torch"],"contact":"+91-9876543210","rating":4.8,"missions_completed":34},
    {"id":"v2","name":"Priya Patel","lat":25.5960,"lng":85.1400,"skills":["Medical","Food Distribution","Triage"],"availability":True,"supplies":["Medicine","IV Fluids","Food Packets","Stretcher"],"contact":"+91-9765432109","rating":4.9,"missions_completed":58},
    {"id":"v3","name":"Rahul Nair","lat":34.0800,"lng":74.8000,"skills":["Rescue","Communication","Demolition"],"availability":False,"supplies":["Walkie Talkie","Rope","Torch","Crowbar"],"contact":"+91-9654321098","rating":4.6,"missions_completed":22},
    {"id":"v4","name":"Anjali Gupta","lat":13.0850,"lng":80.2750,"skills":["First Aid","Counseling","Child Care"],"availability":True,"supplies":["First Aid Kit","Blankets","Baby Food","Counseling Kits"],"contact":"+91-9543210987","rating":4.7,"missions_completed":41},
    {"id":"v5","name":"Karthik Rajan","lat":13.0900,"lng":80.2850,"skills":["Boat Operation","Water Rescue","Swimming"],"availability":True,"supplies":["Inflatable Boat","Life Jackets","Rope","Torch"],"contact":"+91-9432109876","rating":4.9,"missions_completed":67},
    {"id":"v6","name":"Meena Tiwari","lat":26.1480,"lng":91.7380,"skills":["Food Distribution","Logistics","Cooking"],"availability":True,"supplies":["Food Packets","LPG Stove","Utensils","Dry Rations"],"contact":"+91-9321098765","rating":4.5,"missions_completed":19},
    {"id":"v7","name":"Deepak Verma","lat":22.5700,"lng":88.3650,"skills":["Medical","Nursing","Wound Care"],"availability":False,"supplies":["Medical Bag","Bandages","Antiseptic","Saline"],"contact":"+91-9210987654","rating":4.8,"missions_completed":47},
    {"id":"v8","name":"Sunita Bisht","lat":30.0650,"lng":79.0180,"skills":["Evacuation","Transport","Driving"],"availability":True,"supplies":["4WD Vehicle","Fuel","Water Cans","Tarpaulin"],"contact":"+91-9109876543","rating":4.6,"missions_completed":28},
    {"id":"v9","name":"Mohammed Farhan","lat":17.3870,"lng":78.4880,"skills":["Search & Rescue","Structural Assessment","Rope Rescue"],"availability":True,"supplies":["Rope","Torch","Crowbar","Safety Helmet","Gloves"],"contact":"+91-9098765432","rating":4.7,"missions_completed":39},
    {"id":"v10","name":"Lakshmi Devi","lat":16.5100,"lng":80.6520,"skills":["Counseling","Child Care","Shelter Management"],"availability":True,"supplies":["Blankets","Baby Supplies","Hygiene Kits"],"contact":"+91-8987654321","rating":4.4,"missions_completed":15},
    {"id":"v11","name":"Ravi Shankar","lat":23.0260,"lng":72.5750,"skills":["Engineering","Structural Safety","Demolition"],"availability":True,"supplies":["Safety Gear","Crowbar","Rope","Helmet","Goggles"],"contact":"+91-8876543210","rating":4.5,"missions_completed":23},
    {"id":"v12","name":"Ananya Das","lat":27.3300,"lng":88.6100,"skills":["Medical","Altitude Medicine","First Aid"],"availability":True,"supplies":["Oxygen Cylinder","Medicine","Warm Clothes","Sleeping Bag"],"contact":"+91-8765432109","rating":4.9,"missions_completed":52},
    {"id":"v13","name":"Tejinder Singh","lat":31.1000,"lng":75.3412,"skills":["Communication","Radio Operation","Coordination"],"availability":False,"supplies":["HAM Radio","Satellite Phone","Backup Batteries"],"contact":"+91-8654321098","rating":4.3,"missions_completed":11},
    {"id":"v14","name":"Pooja Iyer","lat":11.0168,"lng":76.9558,"skills":["Food Distribution","Medical","Sanitation"],"availability":True,"supplies":["Food Packets","ORS","Chlorine Tablets","Hygiene Kits"],"contact":"+91-8543210987","rating":4.6,"missions_completed":30},
    {"id":"v15","name":"Anil Kumar Yadav","lat":25.5900,"lng":85.1500,"skills":["Boat Operation","Water Rescue","Fishing"],"availability":True,"supplies":["Wooden Boat","Oars","Life Jackets","Rope","Torch"],"contact":"+91-8432109876","rating":4.7,"missions_completed":44},
    {"id":"v16","name":"Kavya Reddy","lat":17.3830,"lng":78.4830,"skills":["Logistics","Supply Chain","Transport"],"availability":True,"supplies":["Truck Access","Fuel","Food Supplies","Tarpaulin"],"contact":"+91-8321098765","rating":4.4,"missions_completed":18},
    {"id":"v17","name":"Bibhuti Bhushan","lat":26.1520,"lng":91.7420,"skills":["Rescue","Swimming","Boat Operation"],"availability":False,"supplies":["Rescue Boat","Rope","Life Jackets","Emergency Lights"],"contact":"+91-8210987654","rating":4.8,"missions_completed":61},
    {"id":"v18","name":"Smita Patil","lat":22.5680,"lng":88.3600,"skills":["Nursing","Child Care","Counseling"],"availability":True,"supplies":["Nursing Kit","Baby Supplies","Medicines","Blankets"],"contact":"+91-8109876543","rating":4.6,"missions_completed":33},
    {"id":"v19","name":"Gaurav Joshi","lat":30.7350,"lng":77.1200,"skills":["Rope Rescue","Mountaineering","Search & Rescue"],"availability":True,"supplies":["Climbing Gear","Rope","Harness","Ice Axe","First Aid"],"contact":"+91-7998765432","rating":4.9,"missions_completed":76},
    {"id":"v20","name":"Rekha Nambiar","lat":8.5200,"lng":76.9450,"skills":["Medical","Ayurveda","Nursing"],"availability":True,"supplies":["Medicine","Herbal Kits","First Aid","Water Purification Tablets"],"contact":"+91-7887654321","rating":4.5,"missions_completed":26},
    {"id":"v21","name":"Harpreet Kaur","lat":30.9000,"lng":75.8600,"skills":["Food Distribution","Cooking","Logistics"],"availability":True,"supplies":["Langar Setup","LPG","Dal Rice","Roti Maker","Utensils"],"contact":"+91-7776543210","rating":4.8,"missions_completed":55},
    {"id":"v22","name":"Siddharth Rao","lat":13.0800,"lng":80.2700,"skills":["Communication","IT Support","Mapping"],"availability":False,"supplies":["Laptop","Satellite Internet","GPS Device","Power Bank"],"contact":"+91-7665432109","rating":4.3,"missions_completed":9},
    {"id":"v23","name":"Durgesh Pandey","lat":25.4358,"lng":81.8463,"skills":["Rescue","Demolition","Heavy Equipment"],"availability":True,"supplies":["Crowbar","Sledgehammer","Safety Helmet","Rope","Torch"],"contact":"+91-7554321098","rating":4.5,"missions_completed":31},
    {"id":"v24","name":"Anuradha Krishnan","lat":12.9716,"lng":77.5946,"skills":["Counseling","Mental Health","Trauma Support"],"availability":True,"supplies":["Counseling Kits","Stress Relief Material","Notebooks","Crayons for Kids"],"contact":"+91-7443210987","rating":4.7,"missions_completed":37},
    {"id":"v25","name":"Naresh Meena","lat":26.9124,"lng":75.7873,"skills":["Transport","Driving","Logistics"],"availability":True,"supplies":["Bus (50 seater)","Fuel","Water Cans","Basic Rations"],"contact":"+91-7332109876","rating":4.4,"missions_completed":21},
]

MOCK_RELIEF_POSTS = [
    {"id":"rp1","volunteer_id":"v1","volunteer_name":"Arjun Sharma","description":"Successfully evacuated 47 people from landslide zone near Fagu village. All are safe at Rajiv Gandhi Hall shelter. 3 injured being treated. Need more blankets and warm clothing urgently.","location_name":"Fagu Village, Shimla","lat":30.7320,"lng":77.1155,"supply_type":"Shelter","timestamp":"2024-08-12T15:30:00Z","likes":145},
    {"id":"rp2","volunteer_id":"v2","volunteer_name":"Priya Patel","description":"Medical camp fully operational at Rajiv Gandhi Hall. Treated 212 patients in last 24 hours. 8 in serious condition transferred to IGMC. Running critically low on oral rehydration salts, paracetamol and anti-diarrheal medicines. Please donate or drop supplies.","location_name":"Rajiv Gandhi Hall, Patna","lat":25.5950,"lng":85.1390,"supply_type":"Medicine","timestamp":"2024-08-20T18:00:00Z","likes":289},
    {"id":"rp3","volunteer_id":"v4","volunteer_name":"Anjali Gupta","description":"SAFE ROUTE UPDATE: NH44 bridge at km-32 is damaged — DO NOT USE. Alternate route via Tambaram-Mudichur Road is clear and safe. Estimated extra travel time 40 minutes. Police escort available at Chrompet junction for convoy movement.","location_name":"Chennai South Evacuation Corridor","lat":13.0870,"lng":80.2780,"supply_type":"Shelter","timestamp":"2024-11-25T10:15:00Z","likes":412},
    {"id":"rp4","volunteer_id":"v5","volunteer_name":"Karthik Rajan","description":"Boat rescue operations ongoing in Tondiarpet area. Our team of 6 with 2 boats has rescued 89 people including 12 elderly and 8 children since morning. Water level still rising. Requesting more life jackets at Marina Beach staging area.","location_name":"Tondiarpet, Chennai","lat":13.1050,"lng":80.2930,"supply_type":"Shelter","timestamp":"2024-11-25T13:00:00Z","likes":334},
    {"id":"rp5","volunteer_id":"v6","volunteer_name":"Meena Tiwari","description":"Community kitchen started at Golaghat relief camp. Serving hot meals to 800+ displaced people 3 times daily. We need more dal, rice, oil and firewood. Local volunteers please report to Numaligarh Refinery gate no. 3 at 6am tomorrow.","location_name":"Numaligarh, Golaghat, Assam","lat":26.1490,"lng":91.7370,"supply_type":"Food","timestamp":"2024-07-15T16:00:00Z","likes":178},
    {"id":"rp6","volunteer_id":"v12","volunteer_name":"Ananya Das","description":"Altitude sickness cases rising in Kedarnath area. Our team has treated 34 cases in last 12 hours. Two severe HAPE cases airlifted. DO NOT attempt Kedarnath trek until all-clear. If stranded, stay put and signal with mirror or bright cloth — helicopters doing 3 passes daily.","location_name":"Kedarnath Base, Rudraprayag","lat":30.7350,"lng":79.0700,"supply_type":"Medicine","timestamp":"2024-05-08T17:30:00Z","likes":221},
    {"id":"rp7","volunteer_id":"v9","volunteer_name":"Mohammed Farhan","description":"Structural survey of Fatehmaidan colony completed. 14 buildings marked RED (do not enter), 31 buildings YELLOW (use caution). Full list posted at police station and available on WhatsApp at 9098765432. Rescue team clearing rubble at House 47B — 2 people reportedly trapped.","location_name":"Fatehmaidan Colony, Hyderabad","lat":17.3850,"lng":78.4870,"supply_type":"Shelter","timestamp":"2024-09-10T21:00:00Z","likes":267},
    {"id":"rp8","volunteer_id":"v15","volunteer_name":"Anil Kumar Yadav","description":"Boat rescue team update: 118 families evacuated from 9 villages in Hajipur block. Water level at 14.2 feet — worst in 20 years per locals. Bodies of 3 missing persons found near Mokama ghat. Families please contact Patna DM helpline 1070 for information on missing persons.","location_name":"Hajipur Block, Vaishali, Bihar","lat":25.6900,"lng":85.2100,"supply_type":"Shelter","timestamp":"2024-08-21T08:00:00Z","likes":356},
    {"id":"rp9","volunteer_id":"v21","volunteer_name":"Harpreet Kaur","description":"Waheguru Ji Ka Khalsa! Guru Ka Langar running 24x7 at Gurudwara Sahib near cyclone shelter. Free food for ALL affected families regardless of religion. Over 2,000 meals served yesterday. Parking available for relief vehicles. Call 7776543210 for bulk food donations.","location_name":"Machilipatnam Gurudwara, Andhra Pradesh","lat":16.1820,"lng":81.1380,"supply_type":"Food","timestamp":"2024-09-01T10:00:00Z","likes":589},
    {"id":"rp10","volunteer_id":"v24","volunteer_name":"Anuradha Krishnan","description":"Trauma counseling camp for flood survivors at Kolkata. Many adults showing signs of acute stress. Children especially affected — nightmares, bed-wetting, refusing food. FREE counseling sessions daily 9am-5pm. Bring your family. Trained psychologists available. No appointment needed.","location_name":"YMCA Relief Camp, Kolkata","lat":22.5650,"lng":88.3590,"supply_type":"Other","timestamp":"2024-08-06T09:00:00Z","likes":198},
    {"id":"rp11","volunteer_id":"v8","volunteer_name":"Sunita Bisht","description":"ROAD UPDATE — Badrinath Highway: km 89-94 cleared after 36 hrs. Single-lane traffic allowed 8am-12pm and 2pm-6pm only. Night movement strictly prohibited. Heavy vehicles banned. Landslide risk remains HIGH — do not stop on road, keep moving. Next update in 6 hours.","location_name":"Chamoli, Uttarakhand","lat":30.4100,"lng":79.3200,"supply_type":"Shelter","timestamp":"2024-08-19T14:00:00Z","likes":445},
    {"id":"rp12","volunteer_id":"v11","volunteer_name":"Ravi Shankar","description":"WARNING: 3 apartment buildings in Joshimath Sector 4 showing fresh 2-inch cracks in load-bearing walls. Residents MUST evacuate tonight. We have trucks arranged for belongings — call 8876543210 before 8pm. DO NOT sleep in these buildings. Ref: Survey Report JM/2024/114.","location_name":"Joshimath Sector 4, Uttarakhand","lat":30.5540,"lng":79.5630,"supply_type":"Shelter","timestamp":"2024-01-11T16:30:00Z","likes":312},
    {"id":"rp13","volunteer_id":"v14","volunteer_name":"Pooja Iyer","description":"WATER SAFETY ALERT: All hand pumps and open wells in flood-affected Nilambur area contaminated. Use ONLY packaged or boiled water. Our team distributing free water purification tablets — collect from Panchayat office. 3 cases of suspected cholera admitted to govt hospital. Stay safe!","location_name":"Nilambur, Malappuram, Kerala","lat":11.2800,"lng":76.2300,"supply_type":"Water","timestamp":"2024-10-19T11:00:00Z","likes":267},
    {"id":"rp14","volunteer_id":"v23","volunteer_name":"Durgesh Pandey","description":"Search and rescue update from Prayagraj flood zone: Our 8-member team has located and rescued 156 people from 23 locations in last 48 hours. Still searching for 9 missing persons — list shared with NDRF. If you have information about missing persons call 7554321098 any time day or night.","location_name":"Prayagraj Flood Zone, UP","lat":25.4500,"lng":81.8400,"supply_type":"Shelter","timestamp":"2024-08-23T09:00:00Z","likes":401},
    {"id":"rp15","volunteer_id":"v19","volunteer_name":"Gaurav Joshi","description":"Mountain rescue team update: 3 trekkers rescued from Rohtang Pass after 28 hours. All conscious and stable. Hypothermia treated. Helicopter evacuation to Kullu hospital done. ADVISORY: Rohtang, Baralacha La and Kunzum passes closed due to early snowfall. Do NOT attempt crossings.","location_name":"Rohtang Pass, Kullu, Himachal Pradesh","lat":32.3720,"lng":77.2490,"supply_type":"Medicine","timestamp":"2024-09-20T11:00:00Z","likes":523},
]

MOCK_USERS = [
    {"id":"u1","name":"Rajesh Khanna","email":"rajesh.khanna@gmail.com","role":"citizen","phone":"+91-9811234567","city":"New Delhi","state":"Delhi","registered":"2024-01-15"},
    {"id":"u2","name":"Sunita Sharma","email":"sunita.s@yahoo.com","role":"citizen","phone":"+91-9922345678","city":"Shimla","state":"Himachal Pradesh","registered":"2024-02-20"},
    {"id":"u3","name":"Amit Verma","email":"amit.verma@hotmail.com","role":"volunteer","phone":"+91-9733456789","city":"Patna","state":"Bihar","registered":"2024-03-05"},
    {"id":"u4","name":"Geeta Devi","email":"geeta.d@gmail.com","role":"citizen","phone":"+91-9644567890","city":"Ranchi","state":"Jharkhand","registered":"2024-03-18"},
    {"id":"u5","name":"Vikash Singh","email":"vikash.singh@gmail.com","role":"citizen","phone":"+91-9555678901","city":"Muzaffarpur","state":"Bihar","registered":"2024-04-02"},
    {"id":"u6","name":"Pallavi Jain","email":"pallavi.j@gmail.com","role":"volunteer","phone":"+91-9466789012","city":"Bhopal","state":"Madhya Pradesh","registered":"2024-04-15"},
    {"id":"u7","name":"Rajan Pillai","email":"rajan.pillai@gmail.com","role":"citizen","phone":"+91-9377890123","city":"Kochi","state":"Kerala","registered":"2024-05-01"},
    {"id":"u8","name":"Divya Menon","email":"divya.menon@gmail.com","role":"citizen","phone":"+91-9288901234","city":"Kozhikode","state":"Kerala","registered":"2024-05-12"},
    {"id":"u9","name":"Suresh Gowda","email":"suresh.gowda@gmail.com","role":"volunteer","phone":"+91-9199012345","city":"Mysuru","state":"Karnataka","registered":"2024-05-28"},
    {"id":"u10","name":"Anitha Raju","email":"anitha.raju@gmail.com","role":"citizen","phone":"+91-9010123456","city":"Vijayawada","state":"Andhra Pradesh","registered":"2024-06-08"},
    {"id":"u11","name":"Pranav Desai","email":"pranav.desai@gmail.com","role":"admin","phone":"+91-8921234567","city":"Ahmedabad","state":"Gujarat","registered":"2024-01-01"},
    {"id":"u12","name":"Kavitha Nair","email":"kavitha.n@gmail.com","role":"citizen","phone":"+91-8832345678","city":"Thiruvananthapuram","state":"Kerala","registered":"2024-06-20"},
    {"id":"u13","name":"Biplab Das","email":"biplab.das@gmail.com","role":"volunteer","phone":"+91-8743456789","city":"Guwahati","state":"Assam","registered":"2024-07-01"},
    {"id":"u14","name":"Manpreet Gill","email":"manpreet.gill@gmail.com","role":"citizen","phone":"+91-8654567890","city":"Amritsar","state":"Punjab","registered":"2024-07-15"},
    {"id":"u15","name":"Nirmala Devi","email":"nirmala.d@gmail.com","role":"citizen","phone":"+91-8565678901","city":"Dehradun","state":"Uttarakhand","registered":"2024-07-28"},
    {"id":"u16","name":"Subhash Chandra","email":"subhash.c@gmail.com","role":"admin","phone":"+91-8476789012","city":"Lucknow","state":"Uttar Pradesh","registered":"2024-01-05"},
    {"id":"u17","name":"Madhuri Pande","email":"madhuri.pande@gmail.com","role":"volunteer","phone":"+91-8387890123","city":"Allahabad","state":"Uttar Pradesh","registered":"2024-08-01"},
    {"id":"u18","name":"Sanjay Tripathi","email":"sanjay.t@gmail.com","role":"citizen","phone":"+91-8298901234","city":"Varanasi","state":"Uttar Pradesh","registered":"2024-08-10"},
    {"id":"u19","name":"Rina Chakraborty","email":"rina.c@gmail.com","role":"citizen","phone":"+91-8109012345","city":"Kolkata","state":"West Bengal","registered":"2024-08-18"},
    {"id":"u20","name":"Tapan Sarkar","email":"tapan.sarkar@gmail.com","role":"volunteer","phone":"+91-8010123456","city":"Siliguri","state":"West Bengal","registered":"2024-08-25"},
    {"id":"u21","name":"Farida Begum","email":"farida.b@gmail.com","role":"citizen","phone":"+91-7921234567","city":"Bhopal","state":"Madhya Pradesh","registered":"2024-09-01"},
    {"id":"u22","name":"Nitin Kulkarni","email":"nitin.k@gmail.com","role":"citizen","phone":"+91-7832345678","city":"Pune","state":"Maharashtra","registered":"2024-09-08"},
    {"id":"u23","name":"Shweta Singh","email":"shweta.singh@gmail.com","role":"volunteer","phone":"+91-7743456789","city":"Gorakhpur","state":"Uttar Pradesh","registered":"2024-09-15"},
    {"id":"u24","name":"Biren Hazarika","email":"biren.h@gmail.com","role":"citizen","phone":"+91-7654567890","city":"Dibrugarh","state":"Assam","registered":"2024-09-20"},
    {"id":"u25","name":"Lalita Kumari","email":"lalita.k@gmail.com","role":"citizen","phone":"+91-7565678901","city":"Darbhanga","state":"Bihar","registered":"2024-09-28"},
    {"id":"u26","name":"Prasad Rao","email":"prasad.rao@gmail.com","role":"volunteer","phone":"+91-7476789012","city":"Rajahmundry","state":"Andhra Pradesh","registered":"2024-10-02"},
    {"id":"u27","name":"Geetanjali Thakur","email":"geetanjali.t@gmail.com","role":"citizen","phone":"+91-7387890123","city":"Shimla","state":"Himachal Pradesh","registered":"2024-10-10"},
    {"id":"u28","name":"Arun Pal","email":"arun.pal@gmail.com","role":"citizen","phone":"+91-7298901234","city":"Agartala","state":"Tripura","registered":"2024-10-18"},
    {"id":"u29","name":"Deepika Chaudhary","email":"deepika.c@gmail.com","role":"volunteer","phone":"+91-7109012345","city":"Jaipur","state":"Rajasthan","registered":"2024-10-25"},
    {"id":"u30","name":"Mahesh Babu","email":"mahesh.babu@gmail.com","role":"citizen","phone":"+91-7010123456","city":"Tirupati","state":"Andhra Pradesh","registered":"2024-11-01"},
    {
        "id": "u_admin1",
        "name": "Prashant Katoch",
        "email": "prashant.katoch@aapada.gov.in",
        "role": "admin",
        "phone": "+91-9000000000",
        "city": "Shimla",
        "state": "Himachal Pradesh",
        "registered": "2024-01-01"
    },
    {
    "id": "u_admin2",
    "name": "Gopesh Sharma",
    "email": "gopesh.sharma@aapada.gov.in",
    "role": "admin",
    "phone": "+91-9100000001",
    "city": "Shimla",
    "state": "Himachal Pradesh",
    "registered": "2024-01-02"
},
{
    "id": "u_admin3",
    "name": "Ishant Pundir",
    "email": "ishant.pundir@aapada.gov.in",
    "role": "admin",
    "phone": "+91-9100000002",
    "city": "Dehradun",
    "state": "Uttarakhand",
    "registered": "2024-01-03"
},
{
    "id": "u_admin4",
    "name": "Sagar Dadwal",
    "email": "sagar.dadwal@aapada.gov.in",
    "role": "admin",
    "phone": "+91-9100000003",
    "city": "Dharamshala",
    "state": "Himachal Pradesh",
    "registered": "2024-01-04"
},
]

MOCK_ANALYTICS = {
    "total_disasters": 20,
    "active_disasters": 20,
    "total_volunteers": 25,
    "total_shelters": 20,
    "total_users": 30,
    "sos_alerts_today": 14,
    "affected_citizens": 48750,
    "relief_posts": 15,
    "disasters_by_type": {
        "Landslide": 5, "Flood": 6, "Earthquake": 4, "Fire": 3, "Storm": 4
    },
    "disasters_by_severity": {"Low": 3, "Medium": 8, "High": 9},
    "users_by_role": {"citizen": 22, "volunteer": 6, "admin": 2},
    "monthly_trend": [
        {"month": "Jan", "count": 3}, {"month": "Feb", "count": 2},
        {"month": "Mar", "count": 4}, {"month": "Apr", "count": 3},
        {"month": "May", "count": 5}, {"month": "Jun", "count": 4},
        {"month": "Jul", "count": 7}, {"month": "Aug", "count": 12},
        {"month": "Sep", "count": 9}, {"month": "Oct", "count": 5},
        {"month": "Nov", "count": 6}, {"month": "Dec", "count": 3}
    ],
    "shelter_capacity_used": 62,
    "top_volunteer_missions": 76,
}


# ─── Helper Functions ──────────────────────────────────────────────────────────
def haversine_distance(lat1, lng1, lat2, lng2):
    """Calculate distance between two coordinates in meters"""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def get_from_firestore(collection, filters=None):
    """Fetch documents from Firestore"""
    if db is None:
        return None
    try:
        ref = db.collection(collection)
        docs = ref.stream()
        return [{"id": d.id, **d.to_dict()} for d in docs]
    except Exception as e:
        print(f"[Firestore] Error fetching {collection}: {e}")
        return None

def add_to_firestore(collection, data):
    """Add document to Firestore"""
    if db is None:
        return None
    try:
        doc_ref = db.collection(collection).add(data)
        return doc_ref[1].id
    except Exception as e:
        print(f"[Firestore] Error adding to {collection}: {e}")
        return None


# ─── API Routes ────────────────────────────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "service": "Aapada Rakshak API",
        "firebase_connected": db is not None,
        "ml_model": "RandomForest",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })


# --- Disasters ---

@app.route('/api/disasters', methods=['GET'])
def get_disasters():
    disaster_type = request.args.get('type')
    severity = request.args.get('severity')

    # Try Firestore first
    data = get_from_firestore('disasters')
    if data is None:
        data = MOCK_DISASTERS

    # Apply filters
    if disaster_type:
        data = [d for d in data if d.get('type', '').lower() == disaster_type.lower()]
    if severity:
        data = [d for d in data if d.get('severity', '').lower() == severity.lower()]

    return jsonify({"success": True, "data": data, "count": len(data)})


@app.route('/api/disasters', methods=['POST'])
def create_disaster():
    body = request.json
    required = ['type', 'severity', 'lat', 'lng', 'description']
    if not all(k in body for k in required):
        return jsonify({"success": False, "error": "Missing required fields"}), 400

    new_disaster = {
        "type": body['type'],
        "severity": body['severity'],
        "lat": float(body['lat']),
        "lng": float(body['lng']),
        "radius": int(body.get('radius', 5000)),
        "description": body['description'],
        "location_name": body.get('location_name', ''),
        "active": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "created_by": body.get('created_by', 'admin')
    }

    doc_id = add_to_firestore('disasters', new_disaster)
    if doc_id:
        new_disaster['id'] = doc_id
    else:
        new_disaster['id'] = f"d_{len(MOCK_DISASTERS)+1}"
        MOCK_DISASTERS.append(new_disaster)

    return jsonify({"success": True, "data": new_disaster}), 201


@app.route('/api/disasters/<disaster_id>', methods=['DELETE'])
def delete_disaster(disaster_id):
    if db:
        try:
            db.collection('disasters').document(disaster_id).delete()
            return jsonify({"success": True})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    global MOCK_DISASTERS
    MOCK_DISASTERS = [d for d in MOCK_DISASTERS if d['id'] != disaster_id]
    return jsonify({"success": True})


# --- Shelters ---

@app.route('/api/shelters', methods=['GET'])
def get_shelters():
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    radius = request.args.get('radius', 50000, type=float)

    data = get_from_firestore('shelters')
    if data is None:
        data = MOCK_SHELTERS

    # Filter by proximity if coordinates provided
    if lat and lng:
        data = [
            s for s in data
            if haversine_distance(lat, lng, s['lat'], s['lng']) <= radius
        ]
        # Sort by distance
        data.sort(key=lambda s: haversine_distance(lat, lng, s['lat'], s['lng']))

    return jsonify({"success": True, "data": data, "count": len(data)})


@app.route('/api/shelters', methods=['POST'])
def create_shelter():
    body = request.json
    required = ['name', 'lat', 'lng', 'capacity']
    if not all(k in body for k in required):
        return jsonify({"success": False, "error": "Missing required fields"}), 400

    new_shelter = {
        "name": body['name'],
        "lat": float(body['lat']),
        "lng": float(body['lng']),
        "capacity": int(body['capacity']),
        "current_occupancy": int(body.get('current_occupancy', 0)),
        "contact": body.get('contact', ''),
        "contact_person": body.get('contact_person', ''),
        "supplies": body.get('supplies', []),
        "type": body.get('type', 'Evacuation Center'),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    doc_id = add_to_firestore('shelters', new_shelter)
    if doc_id:
        new_shelter['id'] = doc_id
    else:
        new_shelter['id'] = f"s_{len(MOCK_SHELTERS)+1}"
        MOCK_SHELTERS.append(new_shelter)

    return jsonify({"success": True, "data": new_shelter}), 201


# --- Volunteers ---

@app.route('/api/volunteers', methods=['GET'])
def get_volunteers():
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    available_only = request.args.get('available', 'false').lower() == 'true'

    data = get_from_firestore('volunteers')
    if data is None:
        data = MOCK_VOLUNTEERS

    if available_only:
        data = [v for v in data if v.get('availability', False)]

    if lat and lng:
        data.sort(key=lambda v: haversine_distance(lat, lng, v['lat'], v['lng']))

    return jsonify({"success": True, "data": data, "count": len(data)})


@app.route('/api/volunteers', methods=['POST'])
def register_volunteer():
    body = request.json
    required = ['name', 'contact']
    if not all(k in body for k in required):
        return jsonify({"success": False, "error": "Missing required fields"}), 400

    new_volunteer = {
        "name": body['name'],
        "contact": body['contact'],
        "lat": float(body.get('lat', 20.5937)),
        "lng": float(body.get('lng', 78.9629)),
        "skills": body.get('skills', []),
        "availability": True,
        "supplies": body.get('supplies', []),
        "rating": 5.0,
        "missions_completed": 0,
        "registered_at": datetime.now(timezone.utc).isoformat(),
        "user_id": body.get('user_id', '')
    }

    doc_id = add_to_firestore('volunteers', new_volunteer)
    if doc_id:
        new_volunteer['id'] = doc_id
    else:
        new_volunteer['id'] = f"v_{len(MOCK_VOLUNTEERS)+1}"
        MOCK_VOLUNTEERS.append(new_volunteer)

    return jsonify({"success": True, "data": new_volunteer}), 201


# --- Relief Posts ---

@app.route('/api/relief-posts', methods=['GET'])
def get_relief_posts():
    data = get_from_firestore('relief_posts')
    if data is None:
        data = MOCK_RELIEF_POSTS

    # Sort newest first
    data.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    return jsonify({"success": True, "data": data, "count": len(data)})


@app.route('/api/relief-posts', methods=['POST'])
def create_relief_post():
    body = request.json
    required = ['volunteer_name', 'description', 'supply_type']
    if not all(k in body for k in required):
        return jsonify({"success": False, "error": "Missing required fields"}), 400

    new_post = {
        "volunteer_id": body.get('volunteer_id', ''),
        "volunteer_name": body['volunteer_name'],
        "description": body['description'],
        "location_name": body.get('location_name', ''),
        "lat": float(body.get('lat', 20.5937)),
        "lng": float(body.get('lng', 78.9629)),
        "supply_type": body['supply_type'],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "image_url": body.get('image_url', None),
        "likes": 0
    }

    doc_id = add_to_firestore('relief_posts', new_post)
    if doc_id:
        new_post['id'] = doc_id
    else:
        new_post['id'] = f"rp_{len(MOCK_RELIEF_POSTS)+1}"
        MOCK_RELIEF_POSTS.append(new_post)

    return jsonify({"success": True, "data": new_post}), 201


# --- Users ---

@app.route('/api/users', methods=['GET'])
def get_users():
    role = request.args.get('role')
    data = get_from_firestore('users')
    if data is None:
        data = MOCK_USERS
    if role:
        data = [u for u in data if u.get('role', '').lower() == role.lower()]
    return jsonify({"success": True, "data": data, "count": len(data)})


# --- ML Risk Prediction ---

@app.route('/api/predict-risk', methods=['POST'])
def predict_risk():
    body = request.json
    if not body:
        return jsonify({"success": False, "error": "No data provided"}), 400

    predictor = get_predictor()
    result = predictor.predict(
        disaster_type=body.get('disaster_type', 'Flood'),
        latitude=float(body.get('latitude', 20.5937)),
        longitude=float(body.get('longitude', 78.9629)),
        rainfall_mm=float(body.get('rainfall_mm', 100)),
        elevation_m=float(body.get('elevation_m', 500)),
        season=body.get('season', 'Monsoon'),
        past_incidents=int(body.get('past_incidents', 2))
    )

    return jsonify({"success": True, "prediction": result})


# --- SOS Alert ---

@app.route('/api/sos', methods=['POST'])
def send_sos():
    body = request.json

    sos_record = {
        "user_id": body.get('user_id', 'anonymous'),
        "user_name": body.get('user_name', 'Unknown'),
        "lat": float(body.get('lat', 0)),
        "lng": float(body.get('lng', 0)),
        "message": body.get('message', 'Emergency help needed!'),
        "status": "active",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    doc_id = add_to_firestore('sos_alerts', sos_record)
    if doc_id:
        sos_record['id'] = doc_id

    # In production: trigger FCM notification to admins and nearby volunteers
    print(f"[SOS] Alert received from {sos_record['user_name']} at {sos_record['lat']},{sos_record['lng']}")

    return jsonify({
        "success": True,
        "message": "SOS alert sent to emergency responders",
        "sos_id": sos_record.get('id', 'sos_demo')
    })


# --- Analytics ---

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    if db:
        try:
            disasters = [d.to_dict() for d in db.collection('disasters').stream()]
            volunteers = [v.to_dict() for v in db.collection('volunteers').stream()]
            shelters = [s.to_dict() for s in db.collection('shelters').stream()]

            by_type = {}
            by_severity = {}
            for d in disasters:
                by_type[d.get('type', 'Unknown')] = by_type.get(d.get('type', 'Unknown'), 0) + 1
                by_severity[d.get('severity', 'Unknown')] = by_severity.get(d.get('severity', 'Unknown'), 0) + 1

            return jsonify({
                "success": True,
                "data": {
                    "total_disasters": len(disasters),
                    "total_volunteers": len(volunteers),
                    "total_shelters": len(shelters),
                    "total_users": MOCK_ANALYTICS['total_users'],
                    "sos_alerts_today": MOCK_ANALYTICS['sos_alerts_today'],
                    "affected_citizens": MOCK_ANALYTICS['affected_citizens'],
                    "relief_posts": MOCK_ANALYTICS['relief_posts'],
                    "disasters_by_type": by_type,
                    "disasters_by_severity": by_severity,
                    "users_by_role": MOCK_ANALYTICS['users_by_role'],
                    "monthly_trend": MOCK_ANALYTICS['monthly_trend'],
                    "shelter_capacity_used": MOCK_ANALYTICS['shelter_capacity_used'],
                }
            })
        except Exception as e:
            pass

    return jsonify({"success": True, "data": MOCK_ANALYTICS})


# --- Disaster History ---

@app.route('/api/history', methods=['GET'])
def get_history():
    import csv
    dataset_path = os.path.join(os.path.dirname(__file__), '..', 'dataset', 'historical_disasters.csv')
    history = []
    try:
        with open(dataset_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                history.append(row)
        history.sort(key=lambda x: x.get('date', ''), reverse=True)
    except Exception as e:
        print(f"[History] Error: {e}")

    return jsonify({"success": True, "data": history[:50], "total": len(history)})


# ─── Run ───────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("\n" + "="*50)
    print("  🛡️  Aapada Rakshak — Backend API")
    print("  Running on http://localhost:5000")
    print("="*50 + "\n")
    app.run(debug=True, host='0.0.0.0', port=5000)