# MORTEM ☠️
### The Unnecessarily Serious Object Lifespan Predictor

> *"Because even your pencil deserves to know when it will die."*
> 
> *Scientific? No. Dramatic? Absolutely.*

---

## 🔬 Overview

**MORTEM** is a darkly humorous yet functional forensic web application that calculates the remaining lifespan, survival probability, and inevitable cause of death of ordinary everyday objects—such as pencils, coffee mugs, chargers, socks, shoes, earphones, and toothbrushes.

Designed like an official state-level scientific autopsy bureau, MORTEM treats mechanical wear, thermal shock, academic stress, and owner neglect with clinical gravity.

---

## ⚡ Features

1. **Forensic Autopsy Interface**:
   - Dark obsidian UI (`#0b0b0f`) with crimson warning telemetry and clinical styling.
   - Dynamic object selector with custom item autopsy support.
   - Real-time condition slider (0% Destroyed to 100% Mint Condition).
   - Usage frequency and Owner Care calibration matrix.

2. **Rule-Based Prediction Engine**:
   - Multi-variable multiplier calculations based on baseline lifespans, usage impact, condition degradation, and owner responsibility.
   - Controlled forensic randomness ($\pm 8\%$) to simulate chaotic real-world physics.
   - Guaranteed minimum remaining lifespan calculation.

3. **Four-Tier Risk Classification**:
   - **SAFE** ($>75\%$ of baseline remaining): *Object shows no obvious signs of imminent doom.*
   - **AT RISK** ($50\%\text{–}75\%$): *Minor damage detected. Monitor closely.*
   - **CRITICAL** ($20\%\text{–}50\%$): *Decline is accelerating. Prepare replacement.*
   - **TERMINAL** ($<20\%$): *The object has entered its final chapter.*

4. **Dynamic Survival Probability**:
   - Non-linear survival probability gauge ($1\%\text{–}99\%$) calibrated with risk thresholds.

5. **Curated Cause of Death Generator**:
   - Intelligent selection from object-specific forensic causes (e.g. *“Chronic one-angle-only syndrome”*, *“Excessive sharpening during exam preparation”*, *“Separation in the laundry vortex”*).

6. **Official Death Certificate**:
   - High-fidelity printable forensic death certificate with custom official case number (`MORTEM-XXXXX`), estimated time of death, official watermark seal, and one-click browser print (`window.print()`).

7. **Historical Case Registry & Statistics**:
   - Automatic record persistence in `data/predictions.json`.
   - Real-time aggregate telemetry: Total Objects Analyzed, Terminal Cases, Average Survival %, and Most Analyzed Object.
   - Clear history safeguards with prompt confirmation.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.10+, Flask
- **Frontend**: HTML5, Modern CSS3 (Grid, Flexbox, CSS Variables, Glassmorphism), Vanilla JavaScript ES6+
- **Data Storage**: JSON flat files (`objects.json`, `causes.json`, `predictions.json`)
- **Print Engine**: Native CSS `@media print` certificate generator

---

## 📂 Project Structure

```text
MORTEM/
│
├── app.py                     # Flask application & prediction engine
├── requirements.txt           # Python package dependencies
├── README.md                  # Project documentation
│
├── data/
│   ├── objects.json           # Baseline lifespan catalog & object fragility
│   ├── causes.json            # Categorized causes of death
│   └── predictions.json       # Historical case records
│
├── templates/
│   ├── index.html             # Dashboard & object autopsy intake form
│   ├── result.html            # Forensic laboratory autopsy report
│   ├── certificate.html       # Official Certificate of Object Death
│   ├── history.html           # Case archives & historical registry
│   └── about.html             # Scientific protocol & methodology
│
└── static/
    ├── css/
    │   └── style.css          # Dark forensic UI stylesheet & print layout
    ├── js/
    │   └── script.js          # Interactive sliders, animations & telemetry
    └── images/
        └── hero.jpg           # Forensic laboratory visual asset
```

---

## 🚀 Installation & Local Execution

### 1. Prerequisites
Ensure Python 3.8+ is installed on your system.

```bash
python3 --version
```

### 2. Clone or Navigate to Directory
```bash
cd MORTEM
```

### 3. (Optional) Create a Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

### 5. Run the Application
```bash
python app.py
```

### 6. Access in Browser
Navigate to:
```text
http://127.0.0.1:5000/
```

---

## 📊 Prediction Engine Logic

The calculation engine follows an empirical rule-based formula:

$$\text{Estimated Lifespan} = \text{Base Lifespan} \times M_{\text{usage}} \times M_{\text{condition}} \times M_{\text{care}} \times \text{Random Jitter}$$

### Multipliers:

- **Usage Multiplier ($M_{\text{usage}}$)**:
  - Light: `1.25`
  - Moderate: `1.00`
  - Heavy: `0.70`
  - Extreme: `0.45`

- **Condition Multiplier ($M_{\text{condition}}$)**:
  - $90\%\text{–}100\%$: `1.20`
  - $70\%\text{–}89\%$: `1.00`
  - $40\%\text{–}69\%$: `0.75`
  - $20\%\text{–}39\%$: `0.50`
  - $0\%\text{–}19\%$: `0.25`

- **Owner Care Multiplier ($M_{\text{care}}$)**:
  - Excellent: `1.20`
  - Good: `1.05`
  - Questionable: `0.85`
  - Negligent: `0.60`
  - Forgotten: `0.40`

---

## 📝 Example Benchmark Case

- **Subject**: Pencil
- **Usage**: Heavy
- **Condition**: 32%
- **Owner Care**: Questionable
- **Calculated Status**: `☠ TERMINAL`
- **Estimated Remaining Life**: `~4 Days, 13 Hours`
- **Survival Probability**: `11%`
- **Cause of Death**: *"Excessive sharpening during exam preparation."*

---

## 🔮 Future Scope

- **Machine Learning Integration**: Neural regression models trained on community failure reports.
- **Extended Catalog**: Shampoo bottles, umbrellas, house plants, and earbuds.
- **User Accounts & Memorials**: Digital graveyard for retired belongings.
- **Mobile Companion App**: Barcode scanning for instant expiration countdowns.
