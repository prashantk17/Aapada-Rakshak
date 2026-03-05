"""
ml_predictor.py — Aapada Rakshak Disaster Risk Prediction Module
Uses RandomForest Classifier to simulate AI-based risk prediction
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import os

# Disaster type encoding
DISASTER_TYPES = ['Landslide', 'Flood', 'Earthquake', 'Fire', 'Storm']
SEASONS = ['Spring', 'Summer', 'Monsoon', 'Autumn', 'Winter']
RISK_LEVELS = ['Low', 'Medium', 'High']

class DisasterRiskPredictor:
    def __init__(self):
        self.model = None
        self.le_type = LabelEncoder()
        self.le_season = LabelEncoder()
        self.le_risk = LabelEncoder()
        self._train()

    def _load_data(self):
        """Load historical disaster data from CSV"""
        dataset_path = os.path.join(
            os.path.dirname(__file__), '..', 'dataset', 'historical_disasters.csv'
        )
        df = pd.read_csv(dataset_path)
        return df

    def _augment_data(self, df):
        """Augment with synthetic data for better training"""
        synthetic = []
        np.random.seed(42)

        for _ in range(500):
            d_type = np.random.choice(DISASTER_TYPES)
            season = np.random.choice(SEASONS)
            lat = np.random.uniform(8, 37)
            lng = np.random.uniform(68, 97)
            rainfall = np.random.uniform(0, 400)
            elevation = np.random.uniform(0, 5000)
            past_incidents = np.random.randint(0, 8)

            # Rule-based risk assignment for training
            risk_score = 0
            if d_type == 'Landslide':
                risk_score += (elevation / 500) + (rainfall / 100)
            elif d_type == 'Flood':
                risk_score += (rainfall / 80) + (5 - elevation / 200)
            elif d_type == 'Earthquake':
                risk_score += np.random.uniform(0, 3)
            elif d_type == 'Fire':
                risk_score += (2 if season in ['Summer', 'Spring'] else 0.5)
            elif d_type == 'Storm':
                risk_score += (2 if season in ['Monsoon', 'Summer'] else 1)

            risk_score += past_incidents * 0.5

            if risk_score < 3:
                risk = 'Low'
            elif risk_score < 6:
                risk = 'Medium'
            else:
                risk = 'High'

            synthetic.append({
                'type': d_type,
                'latitude': lat,
                'longitude': lng,
                'rainfall_mm': rainfall,
                'elevation_m': elevation,
                'season': season,
                'past_incidents_5yr': past_incidents,
                'risk_level': risk
            })

        synthetic_df = pd.DataFrame(synthetic)
        return pd.concat([df[synthetic_df.columns], synthetic_df], ignore_index=True)

    def _train(self):
        """Train the RandomForest classifier"""
        try:
            df = self._load_data()
            df = self._augment_data(df)

            self.le_type.fit(DISASTER_TYPES)
            self.le_season.fit(SEASONS)
            self.le_risk.fit(RISK_LEVELS)

            df['type_enc'] = self.le_type.transform(df['type'])
            df['season_enc'] = self.le_season.transform(df['season'])
            df['risk_enc'] = self.le_risk.transform(df['risk_level'])

            features = ['type_enc', 'latitude', 'longitude', 'rainfall_mm',
                       'elevation_m', 'season_enc', 'past_incidents_5yr']
            X = df[features].values
            y = df['risk_enc'].values

            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )

            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
            self.model.fit(X_train, y_train)

            accuracy = self.model.score(X_test, y_test)
            print(f"[ML] Model trained. Accuracy: {accuracy:.2%}")

        except Exception as e:
            print(f"[ML] Training error: {e}")
            self._create_fallback_model()

    def _create_fallback_model(self):
        """Fallback: simple rule-based predictor"""
        print("[ML] Using fallback rule-based predictor")
        self.model = None

    def predict(self, disaster_type, latitude, longitude,
                rainfall_mm=100, elevation_m=500,
                season='Monsoon', past_incidents=2):
        """
        Predict risk level for given parameters.
        Returns: dict with risk_level, probability, confidence
        """
        try:
            if disaster_type not in DISASTER_TYPES:
                disaster_type = 'Flood'
            if season not in SEASONS:
                season = 'Monsoon'

            if self.model is not None:
                type_enc = self.le_type.transform([disaster_type])[0]
                season_enc = self.le_season.transform([season])[0]

                features = np.array([[
                    type_enc, latitude, longitude,
                    rainfall_mm, elevation_m, season_enc, past_incidents
                ]])

                pred_enc = self.model.predict(features)[0]
                proba = self.model.predict_proba(features)[0]

                risk_level = self.le_risk.inverse_transform([pred_enc])[0]
                confidence = float(max(proba)) * 100

                # Risk probability map
                risk_proba = {}
                for i, cls in enumerate(self.le_risk.classes_):
                    risk_proba[cls] = round(float(proba[i]) * 100, 1)

                return {
                    'risk_level': risk_level,
                    'confidence': round(confidence, 1),
                    'probabilities': risk_proba,
                    'model': 'RandomForest',
                    'features_used': {
                        'disaster_type': disaster_type,
                        'latitude': latitude,
                        'longitude': longitude,
                        'rainfall_mm': rainfall_mm,
                        'elevation_m': elevation_m,
                        'season': season,
                        'past_incidents': past_incidents
                    }
                }
            else:
                return self._rule_based_predict(
                    disaster_type, latitude, longitude,
                    rainfall_mm, elevation_m, season, past_incidents
                )

        except Exception as e:
            print(f"[ML] Prediction error: {e}")
            return {'risk_level': 'Medium', 'confidence': 50.0,
                    'probabilities': {'Low': 25, 'Medium': 50, 'High': 25},
                    'model': 'Fallback', 'error': str(e)}

    def _rule_based_predict(self, disaster_type, lat, lng,
                             rainfall, elevation, season, past_incidents):
        """Simple rule-based fallback prediction"""
        score = 0
        if disaster_type == 'Landslide':
            score = (elevation / 500) + (rainfall / 100) + past_incidents * 0.5
        elif disaster_type == 'Flood':
            score = (rainfall / 80) + past_incidents * 0.5
        elif disaster_type == 'Earthquake':
            score = 2 + past_incidents * 0.5
        elif disaster_type == 'Fire':
            score = (3 if season in ['Summer', 'Spring'] else 1) + past_incidents * 0.3
        elif disaster_type == 'Storm':
            score = (3 if season in ['Monsoon', 'Summer'] else 1.5) + past_incidents * 0.4

        if score < 3:
            risk = 'Low'
            proba = {'Low': 70, 'Medium': 25, 'High': 5}
        elif score < 6:
            risk = 'Medium'
            proba = {'Low': 20, 'Medium': 60, 'High': 20}
        else:
            risk = 'High'
            proba = {'Low': 5, 'Medium': 25, 'High': 70}

        return {
            'risk_level': risk,
            'confidence': 65.0,
            'probabilities': proba,
            'model': 'RuleBased'
        }


# Singleton instance
_predictor = None

def get_predictor():
    global _predictor
    if _predictor is None:
        _predictor = DisasterRiskPredictor()
    return _predictor
